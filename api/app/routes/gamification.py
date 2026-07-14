from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.mission import Mission, UserMission
from app.models.badge import Badge, UserBadge
from app.models.waste_deposit import WasteDeposit
from app.services.gamification_service import get_level_progress
from app.services.simple_cache import get_cache, set_cache_until
from app.utils.api_response import error_response

gamification_bp = Blueprint('gamification', __name__)


def _get_current_user():
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)


@gamification_bp.route('/missions', methods=['GET'])
@jwt_required()
def get_missions():
    """Get all active missions with current user's progress, filtered by risk label."""
    from app.models.participation_risk import ParticipationRisk

    user = _get_current_user()
    if not user:
        return error_response("User tidak ditemukan", "not_found", status=404)

    # Get user's current risk label
    risk_profile = ParticipationRisk.query.filter_by(user_id=user.id).first()
    user_risk_level = risk_profile.risk_level if risk_profile else None  # e.g. 'low', 'medium', 'high'

    active_missions = Mission.query.filter_by(is_active=True).all()
    result = []

    for mission in active_missions:
        # Filter by target_label: if set, only show to matching risk-level users
        mission_target = mission.target_label  # None / 'high' / 'medium' / 'low'
        if mission_target and mission_target != user_risk_level:
            continue  # skip — not targeted at this user's risk level

        user_mission = UserMission.query.filter_by(
            user_id=user.id,
            mission_id=mission.id,
        ).first()

        mission_data = mission.to_dict()
        mission_data['user_progress'] = user_mission.progress if user_mission else 0
        mission_data['is_completed'] = user_mission.is_completed if user_mission else False
        mission_data['completed_at'] = (
            user_mission.completed_at.isoformat()
            if user_mission and user_mission.completed_at else None
        )

        result.append(mission_data)

    return jsonify({"missions": result}), 200


@gamification_bp.route('/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard():
    """Get top 10 users by total points."""
    now = datetime.now(timezone.utc)
    year, week, _ = now.isocalendar()
    cache_key = f'leaderboard:{year}-W{week}'
    leaderboard = get_cache(cache_key)

    if leaderboard is None:
        top_users = User.query.filter_by(
            role='member'
        ).order_by(
            User.total_points.desc()
        ).limit(10).all()

        leaderboard = []
        for rank, user in enumerate(top_users, 1):
            leaderboard.append({
                'rank': rank,
                'user_id': user.id,
                'name': user.name,
                'total_points': user.total_points,
                'level': user.level,
            })

        next_week_start = (now + timedelta(days=7 - now.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        set_cache_until(cache_key, leaderboard, next_week_start)

    # Get current user's rank
    current_user = _get_current_user()
    current_rank = None
    if current_user:
        # Count how many members have more points
        higher_count = User.query.filter(
            User.role == 'member',
            User.total_points > current_user.total_points
        ).count()
        current_rank = higher_count + 1

    return jsonify({
        "leaderboard": leaderboard,
        "current_user_rank": current_rank,
    }), 200


@gamification_bp.route('/badges/my', methods=['GET'])
@jwt_required()
def get_my_badges():
    """Get current user's earned badges."""
    user = _get_current_user()
    if not user:
        return error_response("User tidak ditemukan", "not_found", status=404)

    user_badges = UserBadge.query.filter_by(user_id=user.id).all()
    all_badges = Badge.query.all()

    def _badge_priority(ub: UserBadge) -> tuple[int, float, datetime]:
        badge = ub.badge
        if not badge:
            return (0, 0.0, ub.earned_at or datetime.min)

        condition_type = (badge.condition_type or '').lower()
        type_weight = {
            'points': 3,
            'total_weight': 2,
            'deposit_count': 1,
        }.get(condition_type, 0)

        return (
            type_weight,
            float(badge.condition_value or 0),
            ub.earned_at or datetime.min,
        )

    user_badges.sort(key=_badge_priority, reverse=True)
    earned = [ub.to_dict() for ub in user_badges]
    earned_ids = {ub.badge_id for ub in user_badges}

    available = [b.to_dict() for b in all_badges if b.id not in earned_ids]

    return jsonify({
        "earned_badges": earned,
        "available_badges": available,
        "total_earned": len(earned),
        "total_available": len(all_badges),
    }), 200


@gamification_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_summary():
    """Get user's gamification summary: points, level, badges, missions."""
    user = _get_current_user()
    if not user:
        return error_response("User tidak ditemukan", "not_found", status=404)

    # Badges count
    badges_count = UserBadge.query.filter_by(user_id=user.id).count()
    total_badges = Badge.query.count()

    # Missions completed
    missions_completed = UserMission.query.filter_by(
        user_id=user.id,
        is_completed=True,
    ).count()
    total_active_missions = Mission.query.filter_by(is_active=True).count()

    # Total deposits
    total_deposits = WasteDeposit.query.filter_by(
        user_id=user.id,
        status='validated',
    ).count()

    # Total weight
    total_weight = db.session.query(
        db.func.coalesce(db.func.sum(WasteDeposit.weight_kg), 0)
    ).filter(
        WasteDeposit.user_id == user.id,
        WasteDeposit.status == 'validated',
    ).scalar()

    # Level progress
    level_info = get_level_progress(user.total_points)

    return jsonify({
        "user_id": user.id,
        "name": user.name,
        "total_points": user.total_points,
        "level": user.level,
        "level_progress": level_info,
        "badges_earned": badges_count,
        "total_badges": total_badges,
        "missions_completed": missions_completed,
        "total_active_missions": total_active_missions,
        "total_deposits": total_deposits,
        "total_weight_kg": round(total_weight, 2),
    }), 200
