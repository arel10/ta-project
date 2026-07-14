from flask import jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app import db
from app.models.badge import UserBadge
from app.models.mission import UserMission
from app.models.participation_risk import ParticipationRisk
from app.models.reward import RewardRedemption
from app.models.user import User
from app.models.waste_deposit import WasteDeposit
from app.routes.admin import admin_bp
from app.routes.admin_common import _get_current_user, _require_admin
from app.utils.api_response import error_response


@admin_bp.route('/members', methods=['GET'])
@jwt_required()
def get_members():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '').strip()
    risk_level = request.args.get('risk_level', '').strip().lower()
    sort_by = request.args.get('sort_by', 'created_at').strip().lower()

    query = User.query.filter_by(role='member')

    if search:
        query = query.filter(
            db.or_(
                User.name.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%'),
                User.account_number.ilike(f'%{search}%'),
            )
        )

    if risk_level in ('low', 'medium', 'high'):
        query = query.join(
            ParticipationRisk,
            ParticipationRisk.user_id == User.id,
        ).filter(func.lower(ParticipationRisk.risk_level) == risk_level)

    if sort_by == 'name':
        query = query.order_by(User.name.asc(), User.created_at.desc())
    elif sort_by == 'total_points':
        query = query.order_by(User.total_points.desc(), User.created_at.desc())
    else:
        query = query.order_by(User.created_at.desc())

    members = query.paginate(page=page, per_page=per_page, error_out=False)

    member_ids = [m.id for m in members.items]
    risk_map = {}
    if member_ids:
        risks = ParticipationRisk.query.filter(ParticipationRisk.user_id.in_(member_ids)).all()
        risk_map = {r.user_id: r.risk_level for r in risks}

    results = []
    for m in members.items:
        member_data = m.to_dict()
        member_data['risk_level'] = risk_map.get(m.id)
        results.append(member_data)

    return jsonify({
        "members": results,
        "total": members.total,
        "page": members.page,
        "pages": members.pages,
    }), 200


@admin_bp.route('/members', methods=['POST'])
@jwt_required()
def create_member():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    data = request.get_json() or {}

    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    account_number = (data.get('account_number') or '').strip().upper() or None
    gender = (data.get('gender') or '').strip() or None
    nik = (data.get('nik') or '').strip() or None
    address = (data.get('address') or '').strip() or None
    department = (data.get('department') or '').strip() or None

    if not name or not email or not password:
        return error_response(
            "Nama, email, dan password wajib diisi",
            "validation_error",
            status=400,
            fields={
                "name": "required" if not name else None,
                "email": "required" if not email else None,
                "password": "required" if not password else None,
            },
        )

    if len(password) < 6:
        return error_response(
            "Password minimal 6 karakter",
            "validation_error",
            status=400,
            fields={"password": "min_length_6"},
        )

    if User.query.filter_by(email=email).first():
        return error_response("Email sudah digunakan", "validation_error", status=400, fields={"email": "duplicate"})

    if account_number and User.query.filter_by(account_number=account_number).first():
        return error_response("No rekening sudah digunakan", "validation_error", status=400, fields={"account_number": "duplicate"})

    if nik and User.query.filter_by(nik=nik).first():
        return error_response("NIK sudah digunakan", "validation_error", status=400, fields={"nik": "duplicate"})

    member = User(
        name=name,
        email=email,
        account_number=account_number,
        gender=gender,
        nik=nik,
        address=address,
        department=department,
        role='member',
        level='Bronze',
        total_points=0,
    )
    member.set_password(password)

    db.session.add(member)
    db.session.commit()

    return jsonify({
        "message": "Anggota berhasil ditambahkan",
        "member": member.to_dict(),
    }), 201


@admin_bp.route('/members/<int:member_id>', methods=['GET'])
@jwt_required()
def get_member_detail(member_id):
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    member = User.query.get(member_id)
    if not member:
        return error_response("Member tidak ditemukan", "not_found", status=404)

    total_deposits = WasteDeposit.query.filter_by(user_id=member_id, status='validated').count()
    total_weight = db.session.query(
        func.coalesce(func.sum(WasteDeposit.weight_kg), 0)
    ).filter(WasteDeposit.user_id == member_id, WasteDeposit.status == 'validated').scalar()

    badges_count = UserBadge.query.filter_by(user_id=member_id).count()
    missions_completed = UserMission.query.filter_by(user_id=member_id, is_completed=True).count()

    risk = ParticipationRisk.query.filter_by(user_id=member_id).first()

    recent_deposits = WasteDeposit.query.filter_by(
        user_id=member_id
    ).order_by(WasteDeposit.created_at.desc()).limit(10).all()

    return jsonify({
        "member": member.to_dict(),
        "stats": {
            "total_deposits": total_deposits,
            "total_weight_kg": round(float(total_weight), 2),
            "badges_count": badges_count,
            "missions_completed": missions_completed,
        },
        "risk_profile": risk.to_dict() if risk else None,
        "recent_deposits": [d.to_dict() for d in recent_deposits],
    }), 200


@admin_bp.route('/members/<int:member_id>', methods=['PUT'])
@jwt_required()
def update_member_detail(member_id):
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    member = User.query.get(member_id)
    if not member or member.role != 'member':
        return error_response("Member tidak ditemukan", "not_found", status=404)

    data = request.get_json() or {}

    if 'name' in data:
        member.name = (data.get('name') or '').strip()
    if 'email' in data:
        member.email = (data.get('email') or '').strip().lower()
    if 'account_number' in data:
        member.account_number = (data.get('account_number') or '').strip().upper() or None

    if 'gender' in data:
        member.gender = (data.get('gender') or '').strip() or None
    if 'nik' in data:
        member.nik = (data.get('nik') or '').strip() or None
    if 'address' in data:
        member.address = (data.get('address') or '').strip() or None
    if 'department' in data:
        member.department = (data.get('department') or '').strip() or None

    if not member.name:
        return error_response("Nama wajib diisi", "validation_error", status=400, fields={"name": "required"})
    if not member.email:
        return error_response("Email wajib diisi", "validation_error", status=400, fields={"email": "required"})

    existing_email = User.query.filter(
        User.email == member.email,
        User.id != member.id,
    ).first()
    if existing_email:
        return error_response("Email sudah digunakan", "validation_error", status=400, fields={"email": "duplicate"})

    if member.account_number:
        existing_account = User.query.filter(
            User.account_number == member.account_number,
            User.id != member.id,
        ).first()
        if existing_account:
            return error_response("No rekening sudah digunakan", "validation_error", status=400, fields={"account_number": "duplicate"})

    db.session.commit()
    return jsonify({
        "message": "Profil anggota berhasil diperbarui",
        "member": member.to_dict(),
    }), 200


@admin_bp.route('/members/<int:member_id>', methods=['DELETE'])
@jwt_required()
def delete_member(member_id):
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    member = User.query.get(member_id)
    if not member or member.role != 'member':
        return error_response("Member tidak ditemukan", "not_found", status=404)

    UserBadge.query.filter_by(user_id=member_id).delete(synchronize_session=False)
    UserMission.query.filter_by(user_id=member_id).delete(synchronize_session=False)
    ParticipationRisk.query.filter_by(user_id=member_id).delete(synchronize_session=False)
    RewardRedemption.query.filter_by(user_id=member_id).delete(synchronize_session=False)
    WasteDeposit.query.filter_by(user_id=member_id).delete(synchronize_session=False)

    db.session.delete(member)
    db.session.commit()

    return jsonify({"message": "Anggota berhasil dihapus"}), 200
