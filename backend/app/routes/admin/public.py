from flask import jsonify

from app import db
from app.models.badge import Badge, UserBadge
from app.models.mission import Mission
from app.models.reward import RewardRedemption
from app.models.user import User
from app.models.waste_deposit import WasteDeposit
from app.routes.admin import admin_bp
from app.services.gamification_service import get_waste_display_name


@admin_bp.route('/public/stats', methods=['GET'])
def public_landing_stats():
    total_members = User.query.filter_by(role='member').count()

    total_weight = db.session.query(
        db.func.coalesce(db.func.sum(WasteDeposit.weight_kg), 0)
    ).filter(WasteDeposit.status == 'validated').scalar()

    total_deposits = WasteDeposit.query.filter_by(status='validated').count()

    total_points_distributed = db.session.query(
        db.func.coalesce(db.func.sum(WasteDeposit.points_earned), 0)
    ).filter(WasteDeposit.status == 'validated').scalar()

    total_redemptions = RewardRedemption.query.filter_by(status='approved').count()

    waste_breakdown = db.session.query(
        WasteDeposit.waste_type,
        db.func.coalesce(db.func.sum(WasteDeposit.weight_kg), 0).label('total_weight'),
        db.func.count(WasteDeposit.id).label('deposit_count'),
    ).filter(
        WasteDeposit.status == 'validated'
    ).group_by(WasteDeposit.waste_type).all()

    waste_data = [
        {
            'waste_type': row.waste_type,
            'label': get_waste_display_name(row.waste_type),
            'total_weight_kg': round(float(row.total_weight or 0), 2),
            'deposit_count': int(row.deposit_count or 0),
        }
        for row in waste_breakdown
    ]

    active_missions = Mission.get_active_query().count()
    total_badges_earned = db.session.query(db.func.count(UserBadge.id)).scalar()

    return jsonify({
        "stats": {
            "total_members": int(total_members),
            "total_weight_kg": round(float(total_weight or 0), 2),
            "total_deposits": int(total_deposits),
            "total_points_distributed": int(total_points_distributed or 0),
            "total_redemptions": int(total_redemptions),
            "active_missions": int(active_missions),
            "total_badges_earned": int(total_badges_earned or 0),
        },
        "waste_breakdown": waste_data,
    }), 200


@admin_bp.route('/public/badges', methods=['GET'])
def public_badges_list():
    badges = Badge.query.order_by(Badge.condition_value.asc()).all()

    result = []
    for badge in badges:
        earned_count = UserBadge.query.filter_by(badge_id=badge.id).count()
        result.append({
            **badge.to_dict(),
            'earned_count': int(earned_count),
        })

    return jsonify({"badges": result}), 200
