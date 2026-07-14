from datetime import datetime, timezone

from flask import jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app import db
from app.models.participation_risk import ParticipationRisk
from app.models.reward import RewardRedemption
from app.models.user import User
from app.models.waste_deposit import WasteDeposit
from app.routes.admin import admin_bp
from app.routes.admin_common import _dashboard_base_data, _get_current_user, _require_admin, _serialize_deposit_with_user


@admin_bp.route('/dashboard/kpis', methods=['GET'])
@jwt_required()
def dashboard_kpis():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    kpis, _, _, _ = _dashboard_base_data()
    return jsonify({"success": True, "data": kpis}), 200


@admin_bp.route('/dashboard/trend', methods=['GET'])
@jwt_required()
def dashboard_trend():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    days = request.args.get('days', 30, type=int)
    _, trend, _, _ = _dashboard_base_data(days=days)
    return jsonify({"success": True, "data": trend}), 200


@admin_bp.route('/dashboard/risk-distribution', methods=['GET'])
@jwt_required()
def dashboard_risk_distribution():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    _, _, distribution, _ = _dashboard_base_data()
    return jsonify({"success": True, "data": distribution}), 200


@admin_bp.route('/dashboard/recent-pending', methods=['GET'])
@jwt_required()
def dashboard_recent_pending():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    _, _, _, recent_pending = _dashboard_base_data()
    return jsonify({
        "success": True,
        "data": [_serialize_deposit_with_user(item) for item in recent_pending],
    }), 200


@admin_bp.route('/deposits', methods=['GET'])
@jwt_required()
def get_admin_deposits():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status', '', type=str).strip()
    search = request.args.get('search', '', type=str).strip()

    query = WasteDeposit.query.join(User, WasteDeposit.user_id == User.id)

    if status:
        query = query.filter(WasteDeposit.status == status)

    if search:
        like = f'%{search}%'
        query = query.filter(
            db.or_(
                User.name.ilike(like),
                User.account_number.ilike(like),
            )
        )

    pagination = query.order_by(WasteDeposit.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "success": True,
        "data": {
            "data": [_serialize_deposit_with_user(item) for item in pagination.items],
            "total": pagination.total,
            "page": pagination.page,
            "per_page": per_page,
            "total_pages": pagination.pages,
        },
    }), 200


@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard_stats():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_members = User.query.filter_by(role='member').count()
    deposits_today = WasteDeposit.query.filter(WasteDeposit.created_at >= today_start).count()
    high_risk_count = ParticipationRisk.query.filter_by(risk_level='high').count()
    total_points_distributed = db.session.query(
        func.coalesce(func.sum(WasteDeposit.points_earned), 0)
    ).filter(WasteDeposit.status == 'validated').scalar()
    total_weight = db.session.query(
        func.coalesce(func.sum(WasteDeposit.weight_kg), 0)
    ).filter(WasteDeposit.status == 'validated').scalar()
    pending_deposits = WasteDeposit.query.filter_by(status='pending').count()
    pending_redemptions = RewardRedemption.query.filter_by(status='pending').count()

    _, trend, distribution, _ = _dashboard_base_data()

    return jsonify({
        "stats": {
            "total_members": total_members,
            "deposits_today": deposits_today,
            "high_risk_count": high_risk_count,
            "total_points_distributed": total_points_distributed,
            "total_weight_kg": round(float(total_weight), 2),
            "pending_deposits": pending_deposits,
            "pending_redemptions": pending_redemptions,
        },
        "deposit_trend": trend,
        "risk_distribution": distribution,
    }), 200
