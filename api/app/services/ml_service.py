import requests
import logging
from collections import defaultdict
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
from flask import current_app
from sqlalchemy import func
from app import db
from app.models.user import User
from app.models.waste_deposit import WasteDeposit
from app.models.participation_risk import ParticipationRisk

logger = logging.getLogger(__name__)

OBSERVATION_MONTHS = 6


def normalize_risk_level(raw_level: str | None) -> str:
    """Normalize ML labels to DB-safe values: low, medium, high."""
    if not raw_level:
        return 'unknown'

    level = raw_level.strip().lower().replace('_', ' ')

    mapping = {
        'low': 'low',
        'low risk': 'low',
        'medium': 'medium',
        'medium risk': 'medium',
        'med': 'medium',
        'high': 'high',
        'high risk': 'high',
    }
    return mapping.get(level, 'unknown')


def calculate_features(user_id: int) -> dict | None:
    """
    Calculate RFM features (Recency, Frequency, Consistency) for a user.
    Returns None if the user has no validated deposits.
    """
    deposits = WasteDeposit.query.filter_by(
        user_id=user_id,
        status='validated'
    ).order_by(WasteDeposit.created_at.desc()).all()

    if not deposits:
        return None

    now = datetime.now(timezone.utc)

    # Recency: days since last deposit
    last_deposit_date = deposits[0].created_at
    if last_deposit_date.tzinfo is None:
        last_deposit_date = last_deposit_date.replace(tzinfo=timezone.utc)
    recency = max(0, (now - last_deposit_date).days)

    # Frequency: total validated deposits
    frequency = len(deposits)

    # Consistency: active months / total months in observation period
    observation_start = now - relativedelta(months=OBSERVATION_MONTHS)
    active_months = set()
    total_months = set()

    for i in range(OBSERVATION_MONTHS):
        month_date = now - relativedelta(months=i)
        total_months.add((month_date.year, month_date.month))

    for deposit in deposits:
        dep_date = deposit.created_at
        if dep_date.tzinfo is None:
            dep_date = dep_date.replace(tzinfo=timezone.utc)
        if dep_date >= observation_start:
            active_months.add((dep_date.year, dep_date.month))

    consistency = len(active_months) / len(total_months) if total_months else 0.0

    return {
        'user_id': user_id,
        'recency': recency,
        'frequency': frequency,
        'consistency': round(consistency, 4),
    }


def predict_single(user_id: int) -> dict | None:
    """
    Calculate features and get ML prediction for a single user.
    Saves result to participation_risk table.
    """
    features = calculate_features(user_id)
    if features is None:
        logger.warning(f"No deposit data for user {user_id}")
        return None

    ml_url = current_app.config['ML_SERVICE_URL']

    try:
        response = requests.post(
            f"{ml_url}/predict",
            json=features,
            timeout=10,
        )
        response.raise_for_status()
        result = response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"ML Service error for user {user_id}: {e}")
        return None

    # Save or update risk profile
    risk = ParticipationRisk.query.filter_by(user_id=user_id).first()
    if not risk:
        risk = ParticipationRisk(user_id=user_id)
        db.session.add(risk)

    risk.recency_days = features['recency']
    risk.frequency = features['frequency']
    risk.consistency_score = features['consistency']
    risk.risk_level = normalize_risk_level(result.get('risk_level'))
    risk.confidence_score = result.get('confidence_score', 0.0)
    risk.predicted_at = datetime.now(timezone.utc)

    db.session.commit()

    return risk.to_dict()


def predict_batch() -> dict:
    """
    Run ML prediction for all members who have at least one validated deposit.
    Returns batch processing stats and saved risk results.
    """
    now = datetime.now(timezone.utc)
    observation_start = now - relativedelta(months=OBSERVATION_MONTHS)

    # Batch aggregate: one query for core stats per user.
    base_rows = db.session.query(
        WasteDeposit.user_id.label('user_id'),
        func.max(WasteDeposit.created_at).label('last_deposit_at'),
        func.count(WasteDeposit.id).label('frequency'),
    ).filter(
        WasteDeposit.status == 'validated'
    ).group_by(
        WasteDeposit.user_id
    ).all()

    if not base_rows:
        return {
            'total_requested': 0,
            'total_predicted': 0,
            'total_saved': 0,
            'total_errors': 0,
            'results': [],
        }

    # Second aggregate only for observation window consistency.
    active_rows = db.session.query(
        WasteDeposit.user_id.label('user_id'),
        func.count(func.distinct(func.date_trunc('month', WasteDeposit.created_at))).label('active_months'),
    ).filter(
        WasteDeposit.status == 'validated',
        WasteDeposit.created_at >= observation_start,
    ).group_by(
        WasteDeposit.user_id
    ).all()

    active_map = {int(row.user_id): int(row.active_months or 0) for row in active_rows}

    batch_features = []
    for row in base_rows:
        user_id = int(row.user_id)
        last_deposit_at = row.last_deposit_at
        if not last_deposit_at:
            continue

        if last_deposit_at.tzinfo is None:
            last_deposit_at = last_deposit_at.replace(tzinfo=timezone.utc)

        recency = max(0, (now - last_deposit_at).days)
        frequency = int(row.frequency or 0)
        active_months = active_map.get(user_id, 0)
        consistency = active_months / OBSERVATION_MONTHS if OBSERVATION_MONTHS else 0.0

        batch_features.append({
            'user_id': user_id,
            'recency': recency,
            'frequency': frequency,
            'consistency': round(consistency, 4),
        })

    if not batch_features:
        return {
            'total_requested': 0,
            'total_predicted': 0,
            'total_saved': 0,
            'total_errors': 0,
            'results': [],
        }

    ml_url = current_app.config['ML_SERVICE_URL']

    try:
        timeout_seconds = int(current_app.config.get('ML_BATCH_TIMEOUT', 300))
        response = requests.post(
            f"{ml_url}/predict/batch",
            json=batch_features,
            timeout=timeout_seconds,
        )
        response.raise_for_status()
        results = response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"ML Batch prediction error: {e}")
        raise RuntimeError("ML Service batch analysis gagal atau timeout") from e

    # Save all results
    saved_results = []
    if isinstance(results, dict):
        predictions = results.get('predictions', [])
        total_errors = int(results.get('total_errors', 0) or 0)
    else:
        predictions = results
        total_errors = 0

    feature_map = {int(item['user_id']): item for item in batch_features}
    prediction_ids = [int(pred.get('user_id')) for pred in predictions if pred.get('user_id') is not None]
    existing_risks = {}
    if prediction_ids:
        rows = ParticipationRisk.query.filter(ParticipationRisk.user_id.in_(prediction_ids)).all()
        existing_risks = {int(r.user_id): r for r in rows}

    for pred in predictions:
        uid = pred.get('user_id')
        if uid is None:
            continue

        uid = int(uid)

        risk = existing_risks.get(uid)
        if not risk:
            risk = ParticipationRisk(user_id=uid)
            db.session.add(risk)
            existing_risks[uid] = risk

        # O(1) feature lookup instead of linear scan
        feat = feature_map.get(uid)
        if feat:
            risk.recency_days = feat['recency']
            risk.frequency = feat['frequency']
            risk.consistency_score = feat['consistency']

        risk.risk_level = normalize_risk_level(pred.get('risk_level'))
        risk.confidence_score = pred.get('confidence_score', 0.0)
        risk.predicted_at = datetime.now(timezone.utc)

        saved_results.append(risk.to_dict())

    db.session.commit()
    return {
        'total_requested': len(batch_features),
        'total_predicted': len(predictions),
        'total_saved': len(saved_results),
        'total_errors': total_errors,
        'results': saved_results,
    }


def get_risk_summary() -> dict:
    """
    Get risk distribution summary for admin dashboard.
    """
    rows = db.session.query(
        ParticipationRisk,
        User,
    ).join(
        User,
        User.id == ParticipationRisk.user_id,
    ).all()

    summary = {'low': 0, 'medium': 0, 'high': 0}
    analyzed_users = []
    high_risk_users = []

    for risk, user in rows:
        level = normalize_risk_level(risk.risk_level)
        if level in summary:
            summary[level] += 1

        user_payload = {
            'user_id': user.id,
            'name': user.name,
            'email': user.email,
            'account_number': user.account_number,
            'recency_days': risk.recency_days,
            'frequency': risk.frequency,
            'consistency_score': risk.consistency_score,
            'risk_level': level,
            'confidence_score': risk.confidence_score,
            'predicted_at': risk.predicted_at.isoformat() if risk.predicted_at else None,
        }
        analyzed_users.append(user_payload)

        if level == 'high':
            high_risk_users.append(user_payload)

    analyzed_users.sort(
        key=lambda x: (x['predicted_at'] is None, x['predicted_at']),
        reverse=True,
    )
    high_risk_users.sort(
        key=lambda x: (x['predicted_at'] is None, x['predicted_at']),
        reverse=True,
    )

    last_analyzed_at = analyzed_users[0]['predicted_at'] if analyzed_users else None

    return {
        'total_analyzed': len(rows),
        'distribution': summary,
        'users': analyzed_users,
        'high_risk_users': high_risk_users,
        'last_analyzed_at': last_analyzed_at,
    }


def get_risk_trend(months: int = 6) -> list[dict]:
    """Return real monthly distribution of risk profiles based on predicted_at."""
    now = datetime.now(timezone.utc)
    month_starts = []
    for i in range(months - 1, -1, -1):
        month_date = now - relativedelta(months=i)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_starts.append(month_start)

    month_keys = [(d.year, d.month) for d in month_starts]
    rows_by_month = {
        key: {'month': month_starts[idx].strftime('%b'), 'low': 0, 'medium': 0, 'high': 0}
        for idx, key in enumerate(month_keys)
    }

    from_date = month_starts[0]
    month_start_expr = func.date_trunc('month', ParticipationRisk.predicted_at)
    trend_rows = db.session.query(
        month_start_expr.label('month_start'),
        func.lower(ParticipationRisk.risk_level).label('risk_level'),
        func.count(ParticipationRisk.id).label('total'),
    ).filter(
        ParticipationRisk.predicted_at >= from_date,
        ParticipationRisk.risk_level.isnot(None),
    ).group_by(
        month_start_expr,
        func.lower(ParticipationRisk.risk_level),
    ).all()

    counts = defaultdict(lambda: {'low': 0, 'medium': 0, 'high': 0})
    for row in trend_rows:
        level = normalize_risk_level(row.risk_level)
        if level not in ('low', 'medium', 'high') or not row.month_start:
            continue
        key = (row.month_start.year, row.month_start.month)
        if key in rows_by_month:
            counts[key][level] += int(row.total or 0)

    for key, row in rows_by_month.items():
        row['low'] = counts[key]['low']
        row['medium'] = counts[key]['medium']
        row['high'] = counts[key]['high']

    return [rows_by_month[key] for key in month_keys]
