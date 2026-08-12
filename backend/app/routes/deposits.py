from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.waste_deposit import WasteDeposit
from app.services.gamification_service import (
    calculate_points,
    check_mission_progress,
    sync_user_level_and_badges,
    get_active_waste_point_rates,
    get_waste_display_name,
)
from app.utils.api_response import error_response

deposits_bp = Blueprint('deposits', __name__)


def _get_current_user():
    """Helper to get the current authenticated user."""
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)


def _require_admin(user):
    """Return error response if user is not admin, otherwise None."""
    if not user or not user.is_admin:
        return error_response("Akses ditolak, hanya admin", "forbidden", status=403)
    return None


@deposits_bp.route('', methods=['POST'])
@jwt_required()
def create_deposit():
    """Member creates a new waste deposit (status: pending)."""
    user = _get_current_user()
    if not user:
        return error_response("User tidak ditemukan", "not_found", status=404)

    data = request.get_json()
    if not data:
        return error_response("Request body tidak boleh kosong", "validation_error", status=400)

    weight_kg = data.get('weight_kg')
    waste_type = data.get('waste_type', '').strip().lower()

    if not weight_kg or not waste_type:
        return error_response(
            "Berat (kg) dan jenis sampah wajib diisi",
            "validation_error",
            status=400,
            fields={
                "weight_kg": "required" if not weight_kg else None,
                "waste_type": "required" if not waste_type else None,
            },
        )

    try:
        weight_kg = float(weight_kg)
    except (ValueError, TypeError):
        return error_response("Berat harus berupa angka", "validation_error", status=400, fields={"weight_kg": "invalid"})

    if weight_kg <= 0:
        return error_response("Berat harus lebih dari 0", "validation_error", status=400, fields={"weight_kg": "min_0"})

    active_rates = get_active_waste_point_rates() or []
    valid_types = set()
    try:
        for r in active_rates:
            if isinstance(r, dict):
                code = (r.get('code') or '').strip().lower()
            else:
                code = (getattr(r, 'code', '') or '').strip().lower()
            if code:
                valid_types.add(code)
    except Exception:
        valid_types = set()
    if waste_type not in valid_types:
        return error_response(
            "Jenis sampah tidak valid atau belum aktif",
            "validation_error",
            status=400,
            fields={"waste_type": "invalid"},
        )

    deposit = WasteDeposit(
        user_id=user.id,
        weight_kg=weight_kg,
        waste_type=waste_type,
        status='pending',
        points_earned=0,
    )
    db.session.add(deposit)
    db.session.commit()

    return jsonify({
        "message": "Setoran berhasil dibuat, menunggu validasi admin",
        "deposit": deposit.to_dict(),
        "estimated_points": calculate_points(weight_kg, waste_type),
    }), 201


@deposits_bp.route('/waste-point-rates', methods=['GET'])
@jwt_required()
def get_waste_point_rates():
    """Get active waste type rates for member-side forms."""
    rates = get_active_waste_point_rates()
    return jsonify({
        "rates": [r.to_dict() for r in rates],
    }), 200


@deposits_bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_deposits():
    """Member retrieves their own deposit history."""
    user = _get_current_user()
    if not user:
        return error_response("User tidak ditemukan", "not_found", status=404)

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    deposits = WasteDeposit.query.filter_by(
        user_id=user.id
    ).order_by(
        WasteDeposit.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "deposits": [
            {
                **d.to_dict(),
                "waste_label": get_waste_display_name(d.waste_type),
            }
            for d in deposits.items
        ],
        "total": deposits.total,
        "page": deposits.page,
        "pages": deposits.pages,
    }), 200


@deposits_bp.route('/pending', methods=['GET'])
@jwt_required()
def get_pending_deposits():
    """Admin retrieves all pending deposits."""
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    deposits = db.session.query(
        WasteDeposit,
        User.name.label('user_name'),
        User.account_number.label('user_account_number'),
    ).join(
        User,
        WasteDeposit.user_id == User.id,
    ).filter(
        WasteDeposit.status == 'pending'
    ).order_by(
        WasteDeposit.created_at.asc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    results = []
    for d, user_name, user_account_number in deposits.items:
        deposit_data = d.to_dict()
        deposit_data['waste_label'] = get_waste_display_name(d.waste_type)
        deposit_data['user_name'] = user_name
        deposit_data['user_account_number'] = user_account_number
        results.append(deposit_data)

    return jsonify({
        "deposits": results,
        "total": deposits.total,
        "page": deposits.page,
        "pages": deposits.pages,
    }), 200


@deposits_bp.route('/<int:deposit_id>/validate', methods=['PUT'])
@jwt_required()
def validate_deposit(deposit_id):
    """
    Admin validates a pending deposit. This triggers:
    1. Status update to 'validated'
    2. Points calculation and awarding
    3. Mission progress check
    4. Badge eligibility check
    """
    admin = _get_current_user()
    admin_check = _require_admin(admin)
    if admin_check:
        return admin_check

    deposit = WasteDeposit.query.get(deposit_id)
    if not deposit:
        return error_response("Setoran tidak ditemukan", "not_found", status=404)

    if deposit.status == 'validated':
        return error_response("Setoran sudah divalidasi sebelumnya", "validation_error", status=400)

    # Optional: admin can override weight
    data = request.get_json() or {}
    actual_weight = data.get('actual_weight_kg')
    if actual_weight is not None:
        try:
            actual_weight = float(actual_weight)
            if actual_weight > 0:
                deposit.weight_kg = actual_weight
        except (ValueError, TypeError):
            pass

    # 1. Calculate and award points
    points = calculate_points(deposit.weight_kg, deposit.waste_type)
    deposit.points_earned = points
    deposit.status = 'validated'
    deposit.validated_at = datetime.now(timezone.utc)
    deposit.validated_by = admin.id

    # 2. Update user points
    member = User.query.get(deposit.user_id)
    if member:
        member.total_points += points

    db.session.commit()

    # 3. Check mission progress
    check_mission_progress(deposit.user_id)

    # 4. Re-sync level and badges after all point mutations (deposit + missions)
    sync_user_level_and_badges(deposit.user_id)

    return jsonify({
        "message": "Setoran berhasil divalidasi",
        "deposit": deposit.to_dict(),
        "points_earned": points,
    }), 200


@deposits_bp.route('/<int:deposit_id>/reject', methods=['PUT'])
@jwt_required()
def reject_deposit(deposit_id):
    """
    Admin rejects a pending deposit. This triggers:
    1. Status update to 'rejected'
    2. Setting of rejection_reason
    """
    admin = _get_current_user()
    admin_check = _require_admin(admin)
    if admin_check:
        return admin_check

    deposit = WasteDeposit.query.get(deposit_id)
    if not deposit:
        return error_response("Setoran tidak ditemukan", "not_found", status=404)

    if deposit.status == 'validated':
        return error_response("Setoran sudah divalidasi sebelumnya, tidak bisa ditolak", "validation_error", status=400)
    if deposit.status == 'rejected':
        return error_response("Setoran sudah ditolak sebelumnya", "validation_error", status=400)

    data = request.get_json() or {}
    rejection_reason = data.get('rejection_reason', '').strip()
    if not rejection_reason:
        return error_response(
            "Alasan penolakan wajib diisi",
            "validation_error",
            status=400,
            fields={"rejection_reason": "required"}
        )

    deposit.status = 'rejected'
    deposit.rejection_reason = rejection_reason
    deposit.validated_at = datetime.now(timezone.utc)
    deposit.validated_by = admin.id

    db.session.commit()

    return jsonify({
        "message": "Setoran berhasil ditolak",
        "deposit": deposit.to_dict(),
    }), 200


@deposits_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_deposits():
    """Admin retrieves all deposits with optional filters."""
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status_filter = request.args.get('status')
    waste_type_filter = request.args.get('waste_type')

    query = db.session.query(
        WasteDeposit,
        User.name.label('user_name'),
        User.account_number.label('user_account_number'),
    ).join(
        User,
        WasteDeposit.user_id == User.id,
    )

    if status_filter:
        query = query.filter(WasteDeposit.status == status_filter)
    if waste_type_filter:
        query = query.filter(WasteDeposit.waste_type == waste_type_filter)

    deposits = query.order_by(
        WasteDeposit.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    results = []
    for d, user_name, user_account_number in deposits.items:
        deposit_data = d.to_dict()
        deposit_data['waste_label'] = get_waste_display_name(d.waste_type)
        deposit_data['user_name'] = user_name
        deposit_data['user_account_number'] = user_account_number
        results.append(deposit_data)

    return jsonify({
        "deposits": results,
        "total": deposits.total,
        "page": deposits.page,
        "pages": deposits.pages,
    }), 200
