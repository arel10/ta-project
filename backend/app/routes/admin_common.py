from datetime import datetime, timezone, timedelta
import os

from flask import current_app, request
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import func

from app import db
from app.models.badge import UserBadge
from app.models.participation_risk import ParticipationRisk
from app.models.reward import RewardRedemption
from app.models.user import User
from app.models.waste_deposit import WasteDeposit
from app.services.gamification_service import get_waste_display_name
from app.utils.api_response import error_response

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
ALLOWED_IMAGE_MIME_TYPES = {'image/png', 'image/jpeg', 'image/webp'}


def _get_current_user():
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)


def _require_admin(user):
    if not user or not user.is_admin:
        return error_response("Akses ditolak, hanya admin", "forbidden", status=403)
    return None


def _serialize_deposit_with_user(deposit):
    return {
        'id': str(deposit.id),
        'user_id': str(deposit.user_id),
        'user_name': deposit.user.name if deposit.user else '-',
        'account_number': deposit.user.account_number if deposit.user else '-',
        'weight_kg': float(deposit.weight_kg or 0),
        'waste_type': deposit.waste_type,
        'waste_label': get_waste_display_name(deposit.waste_type),
        'status': deposit.status,
        'points_earned': int(deposit.points_earned or 0),
        'created_at': deposit.created_at.isoformat() if deposit.created_at else None,
        'validated_at': deposit.validated_at.isoformat() if deposit.validated_at else None,
        'validated_by': str(deposit.validated_by) if deposit.validated_by else None,
        'notes': None,
    }


def _get_reward_upload_dir():
    upload_root = current_app.config.get('UPLOAD_FOLDER', os.path.join(os.getcwd(), 'uploads'))
    return os.path.join(upload_root, 'rewards')


def _is_allowed_image(filename, mime_type):
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in ALLOWED_IMAGE_EXTENSIONS and mime_type in ALLOWED_IMAGE_MIME_TYPES


def _remove_local_reward_image(image_url):
    if not image_url:
        return

    marker = '/api/admin/reward-images/'
    index = image_url.find(marker)
    if index == -1:
        return

    filename = image_url[index + len(marker):].strip()
    if not filename:
        return

    if os.path.basename(filename) != filename:
        return

    file_path = os.path.join(_get_reward_upload_dir(), filename)
    if os.path.exists(file_path):
        os.remove(file_path)


def _to_absolute_reward_image_url(image_url):
    if not image_url:
        return image_url
    if image_url.startswith('http://') or image_url.startswith('https://'):
        return image_url
    return request.host_url.rstrip('/') + image_url


def _data_dir_path():
    return os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'data')


def _normalize_header(value: object) -> str:
    raw = str(value or '').strip()
    return ' '.join(raw.split())


def _header_map(ws) -> dict[str, int]:
    headers = [_normalize_header(c.value) for c in ws[1]]
    return {name: idx for idx, name in enumerate(headers) if name}


def _find_col(header_index: dict[str, int], aliases: list[str]) -> int | None:
    for alias in aliases:
        key = _normalize_header(alias)
        if key in header_index:
            return header_index[key]
    return None


def _detect_customer_sheet_name(wb) -> str | None:
    from import_dlh_excel import CUSTOMER_ALIASES

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        header_index = _header_map(ws)
        account_col = _find_col(header_index, CUSTOMER_ALIASES['account_number'])
        name_col = _find_col(header_index, CUSTOMER_ALIASES['name'])
        if account_col is not None and name_col is not None:
            return sheet_name
    return None


def _clean_account_number(value: object) -> str:
    if value is None or value == '':
        return ''
    if isinstance(value, float) and value.is_integer():
        return str(int(value)).upper()[:64]
    raw = str(value).strip().replace(' ', '')
    if raw.endswith('.0'):
        raw = raw[:-2]
    return raw.upper()[:64]


def _safe_text(value: object) -> str | None:
    text_value = str(value or '').strip()
    return text_value if text_value else None


def _normalize_gender(value: object) -> str | None:
    text = _safe_text(value)
    if not text:
        return None
    val_upper = text.upper()
    if val_upper in ('L', 'LAKI-LAKI', 'LAKI LAKI', 'PRIA', 'MALE', 'M'):
        return 'Laki-Laki'
    if val_upper in ('P', 'PEREMPUAN', 'WANITA', 'FEMALE', 'F'):
        return 'Perempuan'
    return None


def _generate_unique_import_email(account_number: str) -> str:
    base = f"{account_number.lower()}@import.dlh.local"[:32]
    if not User.query.filter_by(email=base).first():
        return base

    suffix = 1
    while True:
        candidate = f"{account_number.lower()[:20]}_{suffix}@import.dlh.local"[:32]
        if not User.query.filter_by(email=candidate).first():
            return candidate
        suffix += 1


def _dashboard_base_data(days=180):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_members = User.query.filter_by(role='member').count()
    active_members_this_month = WasteDeposit.query.filter(
        WasteDeposit.status == 'validated',
        WasteDeposit.created_at >= now.replace(day=1, hour=0, minute=0, second=0, microsecond=0),
    ).with_entities(WasteDeposit.user_id).distinct().count()

    total_deposits_today = WasteDeposit.query.filter(
        WasteDeposit.created_at >= today_start
    ).count()

    churn_count = ParticipationRisk.query.filter_by(will_churn=True).count()

    total_points_distributed = db.session.query(
        func.coalesce(func.sum(WasteDeposit.points_earned), 0)
    ).filter(WasteDeposit.status == 'validated').scalar()

    total_weight = db.session.query(
        func.coalesce(func.sum(WasteDeposit.weight_kg), 0)
    ).filter(WasteDeposit.status == 'validated').scalar()

    pending_deposits = WasteDeposit.query.filter_by(status='pending').count()
    pending_redemptions = RewardRedemption.query.filter_by(status='pending').count()

    today_date = now.date()
    start_date = today_date - timedelta(days=days - 1)
    
    date_map = {}
    for i in range(days):
        d_str = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
        date_map[d_str] = {'deposit_count': 0, 'total_weight_kg': 0.0}

    days_ago = now - timedelta(days=days - 1)
    start_of_period = days_ago.replace(hour=0, minute=0, second=0, microsecond=0)

    daily_deposits = db.session.query(
        func.date(WasteDeposit.created_at).label('date'),
        func.count(WasteDeposit.id).label('count'),
        func.coalesce(func.sum(WasteDeposit.weight_kg), 0).label('weight'),
    ).filter(
        WasteDeposit.status == 'validated',
        WasteDeposit.created_at >= start_of_period,
    ).group_by(
        func.date(WasteDeposit.created_at)
    ).all()

    for row in daily_deposits:
        raw_date = row.date
        d_str = raw_date.strftime('%Y-%m-%d') if hasattr(raw_date, 'strftime') else str(raw_date).split(' ')[0]
        if d_str in date_map:
            date_map[d_str] = {
                'deposit_count': int(row.count or 0),
                'total_weight_kg': round(float(row.weight or 0), 2),
            }

    trend = [
        {
            'date': d_str,
            'deposit_count': data['deposit_count'],
            'total_weight_kg': data['total_weight_kg'],
        }
        for d_str, data in sorted(date_map.items())
    ]

    churn_distribution = db.session.query(
        ParticipationRisk.will_churn,
        func.count(ParticipationRisk.id),
    ).group_by(ParticipationRisk.will_churn).all()

    dist_map = {'churn': 0, 'not_churn': 0}
    for will_churn, count in churn_distribution:
        key = 'churn' if will_churn else 'not_churn'
        dist_map[key] = int(count)

    recent_pending = WasteDeposit.query.filter_by(status='pending').order_by(
        WasteDeposit.created_at.desc()
    ).limit(5).all()

    kpis = {
        'total_members': int(total_members),
        'active_members_this_month': int(active_members_this_month),
        'total_deposits_today': int(total_deposits_today),
        'total_weight_kg': round(float(total_weight or 0), 2),
        'churn_count': int(churn_count),
        'total_points_distributed': int(total_points_distributed or 0),
        'pending_deposits_count': int(pending_deposits),
        'pending_redemptions_count': int(pending_redemptions),
    }

    return kpis, trend, dist_map, recent_pending