from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.reward import Reward, RewardRedemption
from app.services.simple_cache import get_cache, set_cache, invalidate_cache
from app.utils.api_response import error_response

rewards_bp = Blueprint('rewards', __name__)


def _get_current_user():
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)


def _require_admin(user):
    if not user or not user.is_admin:
        return error_response("Akses ditolak, hanya admin", "forbidden", status=403)
    return None


@rewards_bp.route('', methods=['GET'])
@jwt_required()
def get_rewards():
    """List all available rewards with stock info."""
    cached = get_cache('rewards_active')
    if cached is None:
        rewards = Reward.query.filter_by(is_active=True).order_by(Reward.points_cost.asc()).all()
        cached = set_cache('rewards_active', [r.to_dict() for r in rewards], ttl_seconds=120)

    return jsonify({
        "rewards": cached,
    }), 200


@rewards_bp.route('/redeem', methods=['POST'])
@jwt_required()
def redeem_reward():
    """Member redeems a reward using accumulated points."""
    user = _get_current_user()
    if not user:
        return error_response("User tidak ditemukan", "not_found", status=404)

    data = request.get_json()
    if not data:
        return error_response("Request body tidak boleh kosong", "validation_error", status=400)

    reward_id = data.get('reward_id')
    if not reward_id:
        return error_response("reward_id wajib diisi", "validation_error", status=400, fields={"reward_id": "required"})

    reward = Reward.query.get(reward_id)
    if not reward:
        return error_response("Reward tidak ditemukan", "not_found", status=404)

    if not reward.is_active:
        return error_response("Reward sudah tidak aktif", "validation_error", status=400)

    if reward.stock <= 0:
        return error_response("Stok reward habis", "validation_error", status=400)

    if user.total_points < reward.points_cost:
        return error_response(
            "Poin tidak mencukupi",
            "validation_error",
            status=400,
            fields={
                "required": reward.points_cost,
                "available": user.total_points,
            },
        )

    # Deduct points
    user.total_points -= reward.points_cost

    # Reduce stock
    reward.stock -= 1

    # Create redemption record
    redemption = RewardRedemption(
        user_id=user.id,
        reward_id=reward.id,
        points_spent=reward.points_cost,
        status='pending',
        redemption_code=RewardRedemption.generate_code(),
    )
    db.session.add(redemption)

    # Re-sync level and badge eligibility after points deduction
    from app.services.gamification_service import sync_user_level_and_badges
    sync_user_level_and_badges(user.id, commit=False)

    db.session.commit()

    invalidate_cache('rewards_active')

    return jsonify({
        "message": "Penukaran berhasil diajukan. Reward akan divalidasi admin terlebih dahulu.",
        "redemption": redemption.to_dict(),
        "remaining_points": user.total_points,
        "validation_status": "pending_admin_approval",
        "pickup_location": "Bank Sampah Dinas Lingkungan Hidup Kota Padang",
        "pickup_note": "Silakan klaim reward setelah status disetujui admin.",
    }), 201


@rewards_bp.route('/redemptions/my', methods=['GET'])
@jwt_required()
def get_my_redemptions():
    """Member views their redemption history."""
    user = _get_current_user()
    if not user:
        return error_response("User tidak ditemukan", "not_found", status=404)

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    redemptions = RewardRedemption.query.filter_by(
        user_id=user.id
    ).order_by(
        RewardRedemption.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "redemptions": [r.to_dict() for r in redemptions.items],
        "total": redemptions.total,
        "page": redemptions.page,
        "pages": redemptions.pages,
    }), 200


@rewards_bp.route('/redemptions/<int:redemption_id>/approve', methods=['PUT'])
@jwt_required()
def approve_redemption(redemption_id):
    """Admin approves a pending reward redemption."""
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    redemption = RewardRedemption.query.get(redemption_id)
    if not redemption:
        return error_response("Penukaran tidak ditemukan", "not_found", status=404)

    if redemption.status == 'approved':
        return error_response("Penukaran sudah disetujui sebelumnya", "validation_error", status=400)
    if redemption.status == 'rejected':
        return error_response("Penukaran sudah ditolak sebelumnya", "validation_error", status=400)

    redemption.status = 'approved'
    db.session.commit()

    return jsonify({
        "message": "Penukaran berhasil disetujui",
        "redemption": redemption.to_dict(),
    }), 200


@rewards_bp.route('/redemptions/<int:redemption_id>/reject', methods=['PUT'])
@jwt_required()
def reject_redemption(redemption_id):
    """Admin rejects a pending reward redemption and refunds points."""
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    redemption = RewardRedemption.query.get(redemption_id)
    if not redemption:
        return error_response("Penukaran tidak ditemukan", "not_found", status=404)

    if redemption.status == 'approved':
        return error_response("Penukaran sudah disetujui sebelumnya", "validation_error", status=400)
    if redemption.status == 'rejected':
        return error_response("Penukaran sudah ditolak sebelumnya", "validation_error", status=400)

    member = User.query.get(redemption.user_id)
    if not member:
        return error_response("User tidak ditemukan", "not_found", status=404)

    data = request.get_json() or {}
    rejection_reason = data.get('rejection_reason', '').strip()
    if not rejection_reason:
        return error_response(
            "Alasan penolakan wajib diisi",
            "validation_error",
            status=400,
            fields={"rejection_reason": "required"}
        )

    reward = Reward.query.get(redemption.reward_id)
    if reward:
        reward.stock += 1

    member.total_points += int(redemption.points_spent or 0)
    redemption.status = 'rejected'
    redemption.rejection_reason = rejection_reason
    db.session.commit()

    invalidate_cache('rewards_active')

    return jsonify({
        "message": "Penukaran berhasil ditolak",
        "redemption": redemption.to_dict(),
        "refunded_points": int(redemption.points_spent or 0),
    }), 200


@rewards_bp.route('/redemptions/pending', methods=['GET'])
@jwt_required()
def get_pending_redemptions():
    """Admin views all pending redemptions."""
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    redemptions = db.session.query(
        RewardRedemption,
        User.name.label('user_name'),
        User.account_number.label('user_account_number'),
    ).join(
        User,
        RewardRedemption.user_id == User.id,
    ).filter(
        RewardRedemption.status == 'pending'
    ).order_by(
        RewardRedemption.created_at.asc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    results = []
    for r, user_name, user_account_number in redemptions.items:
        data = r.to_dict()
        data['user_name'] = user_name
        data['user_account_number'] = user_account_number
        results.append(data)

    return jsonify({
        "redemptions": results,
        "total": redemptions.total,
        "page": redemptions.page,
        "pages": redemptions.pages,
    }), 200


@rewards_bp.route('/redemptions/history', methods=['GET'])
@jwt_required()
def get_redemptions_history():
    """Admin views all redemptions history."""
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    status = request.args.get('status', '').strip()

    query = db.session.query(
        RewardRedemption,
        User.name.label('user_name'),
        User.account_number.label('user_account_number'),
    ).join(
        User,
        RewardRedemption.user_id == User.id,
    )

    if status:
        query = query.filter(RewardRedemption.status == status)

    redemptions = query.order_by(
        RewardRedemption.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    results = []
    for r, user_name, user_account_number in redemptions.items:
        data = r.to_dict()
        data['user_name'] = user_name
        data['user_account_number'] = user_account_number
        results.append(data)

    return jsonify({
        "redemptions": results,
        "total": redemptions.total,
        "page": redemptions.page,
        "pages": redemptions.pages,
    }), 200
