from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError
from app import db
from app.models.user import User
from app.models.waste_deposit import WasteDeposit
from app.models.mission import Mission, UserMission
from app.models.badge import Badge, UserBadge
from app.models.waste_point_rate import WastePointRate, DEFAULT_WASTE_POINT_RATES
from app.models.point_setting import PointSetting, DEFAULT_POINT_SETTINGS
from app.services.simple_cache import get_cache, set_cache


# ─── Points Calculation ───────────────────────────────────────────────

# Fallback lama agar data historis tetap aman.
LEGACY_POINTS_PER_KG = {
    'plastik': 100,
    'kertas': 80,
    'logam': 150,
    'kaca': 120,
    'organik': 50,
    'elektronik': 200,
}

LEGACY_WASTE_LABELS = {
    'plastik': 'Plastik',
    'kertas': 'Kertas',
    'logam': 'Logam',
    'kaca': 'Kaca',
    'organik': 'Organik',
    'elektronik': 'Elektronik',
}


def ensure_waste_point_rates_seeded():
    """Create table if needed and seed default waste rates when empty."""
    try:
        WastePointRate.__table__.create(bind=db.engine, checkfirst=True)

        has_data = db.session.query(WastePointRate.id).first()
        if has_data:
            return

        for item in DEFAULT_WASTE_POINT_RATES:
            db.session.add(WastePointRate(
                code=item['code'].upper(),
                name=item['name'],
                category=item.get('category', 'lainnya'),
                points_per_kg=int(item['points_per_kg']),
                is_active=True,
                sort_order=int(item.get('sort_order', 0)),
            ))
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()


def get_active_waste_point_rates():
    ensure_waste_point_rates_seeded()
    cached = get_cache('waste_point_rates_active')
    if cached is not None:
        return cached
    try:
        rates = WastePointRate.query.filter_by(is_active=True).order_by(
            WastePointRate.sort_order.asc(),
            WastePointRate.code.asc(),
        ).all()
        return set_cache('waste_point_rates_active', rates, ttl_seconds=300)
    except SQLAlchemyError:
        return []


def get_points_rate(waste_type: str) -> int:
    raw = (waste_type or '').strip()
    key = raw.lower()

    for rate in get_active_waste_point_rates():
        if key == rate.code.lower() or key == rate.name.lower():
            return int(rate.points_per_kg)

    return int(LEGACY_POINTS_PER_KG.get(key, 50))


def get_waste_display_name(waste_type: str) -> str:
    raw = (waste_type or '').strip()
    key = raw.lower()

    for rate in get_active_waste_point_rates():
        if key == rate.code.lower() or key == rate.name.lower():
            return f"{rate.code.upper()} - {rate.name}"

    return LEGACY_WASTE_LABELS.get(key, raw)


def calculate_points(weight_kg: float, waste_type: str) -> int:
    """Calculate points earned from a deposit based on weight and waste type."""
    rate = get_points_rate(waste_type)
    return int(weight_kg * rate)


# ─── Level System ─────────────────────────────────────────────────────

FALLBACK_LEVELS = [
    (0, 'Bronze'),
    (5000, 'Silver'),
    (10000, 'Gold'),
    (15000, 'Platinum'),
]


def ensure_point_settings_seeded():
    """Create table if needed and seed default level thresholds when empty."""
    try:
        PointSetting.__table__.create(bind=db.engine, checkfirst=True)

        has_data = db.session.query(PointSetting.id).first()
        if has_data:
            return

        for item in DEFAULT_POINT_SETTINGS:
            db.session.add(PointSetting(
                key=item['key'],
                name=item['name'],
                value=int(item['value']),
                sort_order=int(item.get('sort_order', 0)),
            ))
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()


def get_point_settings():
    ensure_point_settings_seeded()
    cached = get_cache('point_settings')
    if cached is not None:
        return cached
    try:
        settings = PointSetting.query.order_by(PointSetting.sort_order.asc()).all()
        return set_cache('point_settings', settings, ttl_seconds=300)
    except SQLAlchemyError:
        return []


def get_levels():
    settings = get_point_settings()
    if not settings:
        return FALLBACK_LEVELS

    raw_levels = []
    for item in settings:
        raw_levels.append((int(item.value), item.name))

    raw_levels.sort(key=lambda x: x[0])

    # Keep thresholds strictly increasing to avoid zero/negative range errors.
    normalized_levels = []
    for threshold, name in raw_levels:
        safe_threshold = max(0, int(threshold))
        if not normalized_levels:
            normalized_levels.append((safe_threshold, name))
            continue

        if safe_threshold <= normalized_levels[-1][0]:
            continue

        normalized_levels.append((safe_threshold, name))

    return normalized_levels or FALLBACK_LEVELS


def build_level_badge_name(level_name: str) -> str:
    return f"Badge Level {level_name}"


def ensure_level_badges_synced() -> list[Badge]:
    """
    Ensure there is one points-based badge for each configured level threshold.

    Badge names follow: "Badge Level <LevelName>" and are updated when
    point settings are changed by admin.
    """
    level_settings = get_point_settings()
    if not level_settings:
        return []

    synced_badges: list[Badge] = []
    for setting in level_settings:
        badge_name = build_level_badge_name(setting.name)
        badge = Badge.query.filter_by(name=badge_name).first()
        if not badge:
            badge = Badge(
                name=badge_name,
                description=f"Mencapai level {setting.name} (minimal {int(setting.value)} poin)",
                condition_type='points',
                condition_value=float(setting.value),
            )
            db.session.add(badge)
        else:
            badge.description = f"Mencapai level {setting.name} (minimal {int(setting.value)} poin)"
            badge.condition_type = 'points'
            badge.condition_value = float(setting.value)

        synced_badges.append(badge)

    return synced_badges


def calculate_user_level(total_points: int) -> str:
    """Determine user level based on total accumulated points."""
    levels = get_levels()
    level_name = levels[0][1] if levels else 'Bronze'
    for threshold, name in levels:
        if total_points >= threshold:
            level_name = name
    return level_name


def get_level_progress(total_points: int) -> dict:
    """Get current level info and progress to next level."""
    levels = get_levels()
    if not levels:
        levels = FALLBACK_LEVELS

    current_level = levels[0][1]
    current_threshold = 0
    next_threshold = None
    next_level = None

    for i, (threshold, name) in enumerate(levels):
        if total_points >= threshold:
            current_level = name
            current_threshold = threshold
            if i + 1 < len(levels):
                next_threshold = levels[i + 1][0]
                next_level = levels[i + 1][1]

    if next_threshold is None:
        progress_percent = 100.0
    else:
        range_total = next_threshold - current_threshold
        range_current = total_points - current_threshold
        if range_total <= 0:
            progress_percent = 100.0
        else:
            progress_percent = min(100.0, max(0.0, (range_current / range_total) * 100))

    return {
        'current_level': current_level,
        'current_threshold': current_threshold,
        'next_level': next_level,
        'next_threshold': next_threshold,
        'progress_percent': round(progress_percent, 1),
    }


# ─── Mission Progress ─────────────────────────────────────────────────

def check_mission_progress(user_id: int):
    """
    Update mission progress for a user after a deposit is validated.
    Checks all active missions and updates/creates UserMission records.
    """
    user = User.query.get(user_id)
    if not user:
        return

    active_missions = Mission.query.filter_by(is_active=True).all()

    for mission in active_missions:
        # Get or create user mission record
        user_mission = UserMission.query.filter_by(
            user_id=user_id,
            mission_id=mission.id
        ).first()

        if not user_mission:
            user_mission = UserMission(
                user_id=user_id,
                mission_id=mission.id,
                progress=0,
                is_completed=False,
            )
            db.session.add(user_mission)

        # Skip if already completed
        if user_mission.is_completed:
            continue

        # Calculate progress based on mission target_type
        if mission.target_type == 'deposit_count':
            # Count validated deposits
            count = WasteDeposit.query.filter_by(
                user_id=user_id,
                status='validated'
            ).count()
            user_mission.progress = min(count, mission.target_value)

        elif mission.target_type == 'weight':
            # Sum validated deposit weights
            total_weight = db.session.query(
                db.func.coalesce(db.func.sum(WasteDeposit.weight_kg), 0)
            ).filter(
                WasteDeposit.user_id == user_id,
                WasteDeposit.status == 'validated'
            ).scalar()
            user_mission.progress = min(total_weight, mission.target_value)

        # Check for completion
        if user_mission.progress >= mission.target_value:
            user_mission.is_completed = True
            user_mission.completed_at = datetime.now(timezone.utc)

            # Award mission points
            user.total_points += mission.points_reward
            user.level = calculate_user_level(user.total_points)

    db.session.commit()


# ─── Badge Eligibility ────────────────────────────────────────────────

def check_badge_eligibility(user_id: int):
    """
    Check all badges and award any that the user has newly qualified for.
    """
    user = User.query.get(user_id)
    if not user:
        return

    all_badges = Badge.query.all()
    earned_badge_ids = {ub.badge_id for ub in UserBadge.query.filter_by(user_id=user_id).all()}

    for badge in all_badges:
        if badge.id in earned_badge_ids:
            continue

        earned = False

        if badge.condition_type == 'deposit_count':
            count = WasteDeposit.query.filter_by(
                user_id=user_id,
                status='validated'
            ).count()
            earned = count >= badge.condition_value

        elif badge.condition_type == 'total_weight':
            total_weight = db.session.query(
                db.func.coalesce(db.func.sum(WasteDeposit.weight_kg), 0)
            ).filter(
                WasteDeposit.user_id == user_id,
                WasteDeposit.status == 'validated'
            ).scalar()
            earned = total_weight >= badge.condition_value

        elif badge.condition_type == 'points':
            earned = user.total_points >= badge.condition_value

        if earned:
            user_badge = UserBadge(
                user_id=user_id,
                badge_id=badge.id,
            )
            db.session.add(user_badge)

    db.session.commit()


def _get_user_deposit_stats(user_id: int) -> tuple[int, float]:
    """Return validated deposit count and total weight for a user."""
    deposit_count = WasteDeposit.query.filter_by(
        user_id=user_id,
        status='validated',
    ).count()

    total_weight = db.session.query(
        db.func.coalesce(db.func.sum(WasteDeposit.weight_kg), 0)
    ).filter(
        WasteDeposit.user_id == user_id,
        WasteDeposit.status == 'validated',
    ).scalar()

    return int(deposit_count), float(total_weight or 0)


def sync_user_level_and_badges(user_id: int, commit: bool = True) -> dict:
    """
    Recalculate a user's level and reconcile user_badges against current eligibility.

    This ensures points/level/badges remain consistent after rule changes.
    """
    user = User.query.get(user_id)
    if not user:
        return {
            'updated': False,
            'level_changed': False,
            'badges_added': 0,
            'badges_removed': 0,
        }

    old_level = user.level
    user.level = calculate_user_level(int(user.total_points or 0))

    deposit_count, total_weight = _get_user_deposit_stats(user_id)
    all_badges = Badge.query.all()

    earned_rows = UserBadge.query.filter_by(user_id=user_id).all()
    earned_map = {row.badge_id: row for row in earned_rows}
    earned_ids = set(earned_map.keys())

    eligible_ids: set[int] = set()
    for badge in all_badges:
        earned = False
        if badge.condition_type == 'deposit_count':
            earned = deposit_count >= badge.condition_value
        elif badge.condition_type == 'total_weight':
            earned = total_weight >= badge.condition_value
        elif badge.condition_type == 'points':
            earned = (user.total_points or 0) >= badge.condition_value

        if earned:
            eligible_ids.add(badge.id)

    to_add = eligible_ids - earned_ids
    to_remove = earned_ids - eligible_ids

    for badge_id in to_add:
        db.session.add(UserBadge(user_id=user_id, badge_id=badge_id))

    for badge_id in to_remove:
        db.session.delete(earned_map[badge_id])

    if commit:
        db.session.commit()

    return {
        'updated': bool(to_add or to_remove or old_level != user.level),
        'level_changed': old_level != user.level,
        'badges_added': len(to_add),
        'badges_removed': len(to_remove),
    }


def sync_all_users_levels_and_badges(commit: bool = True) -> dict:
    """Bulk sync all member users level and badges with latest rules and points."""
    level_badges = ensure_level_badges_synced()
    users = User.query.filter_by(role='member').all()

    totals = {
        'users_processed': 0,
        'users_updated': 0,
        'levels_changed': 0,
        'badges_added': 0,
        'badges_removed': 0,
    }

    for user in users:
        stats = sync_user_level_and_badges(user.id, commit=False)
        totals['users_processed'] += 1
        if stats['updated']:
            totals['users_updated'] += 1
        if stats['level_changed']:
            totals['levels_changed'] += 1
        totals['badges_added'] += stats['badges_added']
        totals['badges_removed'] += stats['badges_removed']

    if commit:
        db.session.commit()

    totals['level_badges_synced'] = len(level_badges)

    return totals
