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

    days = request.args.get('days', 180, type=int)
    _, trend, _, _ = _dashboard_base_data(days=days)
    return jsonify({"success": True, "data": trend}), 200


@admin_bp.route('/dashboard/churn-distribution', methods=['GET'])

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


@admin_bp.route('/notification', methods=['GET'])
@jwt_required()
def dashboard_notification():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    from app.services.gamification_service import get_waste_display_name

    # Fetch pending deposits
    pending_deposits = WasteDeposit.query.filter_by(status='pending').order_by(WasteDeposit.created_at.desc()).limit(10).all()
    
    # Fetch pending redemptions
    pending_redemptions = RewardRedemption.query.filter_by(status='pending').order_by(RewardRedemption.created_at.desc()).limit(10).all()

    notifications = []
    
    for dep in pending_deposits:
        notifications.append({
            "id": f"deposit-{dep.id}",
            "type": "deposit",
            "title": "Setoran Baru",
            "message": f"{dep.user.name if dep.user else 'Anggota'} menyetor {dep.weight_kg}kg {get_waste_display_name(dep.waste_type)}",
            "created_at": dep.created_at.isoformat() if dep.created_at else None,
            "status": "pending",
            "link": "/dashboard/deposits?status=pending"
        })

    for red in pending_redemptions:
        notifications.append({
            "id": f"redemption-{red.id}",
            "type": "redemption",
            "title": "Penukaran Hadiah",
            "message": f"{red.user.name if red.user else 'Anggota'} menukar {red.reward.name if red.reward else 'reward'} dengan {red.points_spent} poin",
            "created_at": red.created_at.isoformat() if red.created_at else None,
            "status": "pending",
            "link": "/dashboard/rewards?tab=pending"
        })

    # Sort notifications by created_at descending
    notifications.sort(key=lambda x: x['created_at'] or '', reverse=True)

    return jsonify({
        "success": True,
        "data": notifications[:20]
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
    churn_count = ParticipationRisk.query.filter_by(will_churn=True).count()
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
            "churn_count": churn_count,
            "total_points_distributed": total_points_distributed,
            "total_weight_kg": round(float(total_weight), 2),
            "pending_deposits": pending_deposits,
            "pending_redemptions": pending_redemptions,
        },
        "deposit_trend": trend,
        "churn_distribution": distribution,
    }), 200
