import requests
import logging
import numpy as np
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


def calculate_features(user_id: int) -> dict | None:
    """
    Calculate churn prediction features for a user.
    Returns 8 features: recency, frequency, consistency, avg_interval,
    std_interval, avg_berat, trend_berat, days_active.
    Returns None if the user has fewer than 2 validated deposits.
    """
    deposits = WasteDeposit.query.filter_by(
        user_id=user_id,
        status='validated'
    ).order_by(WasteDeposit.created_at.asc()).all()

    if not deposits or len(deposits) < 2:
        return None

    now = datetime.now(timezone.utc)

    # Collect timestamps and weights
    timestamps = []
    weights = []
    for dep in deposits:
        dep_date = dep.created_at
        if dep_date.tzinfo is None:
            dep_date = dep_date.replace(tzinfo=timezone.utc)
        timestamps.append(dep_date)
        weights.append(float(dep.weight_kg or 0))

    # 1. Recency: days since last deposit
    recency = max(0, (now - timestamps[-1]).days)

    # 2. Frequency: total validated deposits
    frequency = len(deposits)

    # 3. Consistency: ratio of second-half activity vs first-half
    start = timestamps[0]
    end = timestamps[-1]
    if start == end:
        consistency = 0.5
    else:
        mid_time = start + (end - start) / 2
        n_awal = sum(1 for t in timestamps if t < mid_time)
        n_akhir = sum(1 for t in timestamps if t >= mid_time)
        consistency = n_akhir / (n_awal + 1)

    # 4 & 5. Interval statistics
    intervals = []
    for i in range(1, len(timestamps)):
        diff_days = (timestamps[i] - timestamps[i - 1]).days
        intervals.append(diff_days)

    avg_interval = np.mean(intervals) if intervals else 0.0
    std_interval = np.std(intervals, ddof=1) if len(intervals) > 1 else 0.0

    # 6. Average weight per deposit
    avg_berat = np.mean(weights) if weights else 0.0

    # 7. Weight trend (linear slope)
    if len(weights) >= 2:
        x = np.arange(len(weights))
        slope = np.polyfit(x, weights, 1)[0]
        trend_berat = float(slope)
    else:
        trend_berat = 0.0

    # 8. Days active: span from first to last deposit
    days_active = (timestamps[-1] - timestamps[0]).days

    return {
        'user_id': user_id,
        'recency': recency,
        'frequency': frequency,
        'consistency': round(consistency, 4),
        'avg_interval': round(avg_interval, 2),
        'std_interval': round(std_interval, 2),
        'avg_berat': round(avg_berat, 4),
        'trend_berat': round(trend_berat, 4),
        'days_active': days_active,
    }


def predict_single(user_id: int) -> dict | None:
    """
    Calculate features and get churn prediction for a single user.
    Saves result to participation_risk table.
    """
    features = calculate_features(user_id)
    if features is None:
        logger.warning(f"Insufficient deposit data for user {user_id} (need ≥2)")
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

    # Save or update churn profile
    risk = ParticipationRisk.query.filter_by(user_id=user_id).first()
    if not risk:
        risk = ParticipationRisk(user_id=user_id)
        db.session.add(risk)

    risk.recency_days = features['recency']
    risk.frequency = features['frequency']
    risk.consistency_score = features['consistency']
    risk.avg_interval = features['avg_interval']
    risk.std_interval = features['std_interval']
    risk.avg_berat = features['avg_berat']
    risk.trend_berat = features['trend_berat']
    risk.days_active = features['days_active']
    risk.churn_probability = result.get('churn_probability', 0.0)
    risk.will_churn = result.get('will_churn', False)
    risk.confidence_score = result.get('confidence_score', 0.0)
    risk.predicted_at = datetime.now(timezone.utc)

    db.session.commit()

    return risk.to_dict()


def predict_batch() -> dict:
    """
    Run churn prediction for all members who have at least 2 validated deposits.
    Returns batch processing stats and saved results.
    """
    now = datetime.now(timezone.utc)

    # Get all users with validated deposits
    base_rows = db.session.query(
        WasteDeposit.user_id.label('user_id'),
        func.max(WasteDeposit.created_at).label('last_deposit_at'),
        func.min(WasteDeposit.created_at).label('first_deposit_at'),
        func.count(WasteDeposit.id).label('frequency'),
        func.avg(WasteDeposit.weight_kg).label('avg_berat'),
    ).filter(
        WasteDeposit.status == 'validated'
    ).group_by(
        WasteDeposit.user_id
    ).having(
        func.count(WasteDeposit.id) >= 2  # Need at least 2 deposits for interval features
    ).all()

    if not base_rows:
        return {
            'total_requested': 0,
            'total_predicted': 0,
            'total_saved': 0,
            'total_errors': 0,
            'results': [],
        }

    # For features that need per-deposit data (intervals, consistency, trend),
    # calculate individually per user
    batch_features = []
    for row in base_rows:
        user_id = int(row.user_id)
        features = calculate_features(user_id)
        if features:
            batch_features.append(features)

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

        feat = feature_map.get(uid)
        if feat:
            risk.recency_days = feat['recency']
            risk.frequency = feat['frequency']
            risk.consistency_score = feat['consistency']
            risk.avg_interval = feat['avg_interval']
            risk.std_interval = feat['std_interval']
            risk.avg_berat = feat['avg_berat']
            risk.trend_berat = feat['trend_berat']
            risk.days_active = feat['days_active']

        risk.churn_probability = pred.get('churn_probability', 0.0)
        risk.will_churn = pred.get('will_churn', False)
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


def get_churn_summary() -> dict:
    """
    Get churn distribution summary for admin dashboard.
    Replaces the old risk_summary (high/medium/low).
    """
    rows = db.session.query(
        ParticipationRisk,
        User,
    ).join(
        User,
        User.id == ParticipationRisk.user_id,
    ).all()

    summary = {'churn': 0, 'not_churn': 0}
    analyzed_users = []
    churn_users = []

    for risk, user in rows:
        is_churn = risk.will_churn or False
        if is_churn:
            summary['churn'] += 1
        else:
            summary['not_churn'] += 1

        user_payload = {
            'user_id': user.id,
            'name': user.name,
            'email': user.email,
            'account_number': user.account_number,
            'recency_days': risk.recency_days,
            'frequency': risk.frequency,
            'consistency_score': risk.consistency_score,
            'avg_interval': risk.avg_interval,
            'std_interval': risk.std_interval,
            'avg_berat': risk.avg_berat,
            'trend_berat': risk.trend_berat,
            'days_active': risk.days_active,
            'churn_probability': risk.churn_probability,
            'will_churn': is_churn,
            'confidence_score': risk.confidence_score,
            'predicted_at': risk.predicted_at.isoformat() if risk.predicted_at else None,
        }
        analyzed_users.append(user_payload)

        if is_churn:
            churn_users.append(user_payload)

    # Sort by churn_probability descending (highest risk first)
    analyzed_users.sort(
        key=lambda x: (x['churn_probability'] is None, -(x['churn_probability'] or 0)),
    )
    churn_users.sort(
        key=lambda x: (x['churn_probability'] is None, -(x['churn_probability'] or 0)),
    )

    last_analyzed_at = None
    if analyzed_users:
        dates = [u['predicted_at'] for u in analyzed_users if u['predicted_at']]
        last_analyzed_at = max(dates) if dates else None

    return {
        'total_analyzed': len(rows),
        'distribution': summary,
        'users': analyzed_users,
        'churn_users': churn_users,
        'last_analyzed_at': last_analyzed_at,
    }


def get_churn_trend(months: int = 6) -> list[dict]:
    """Return monthly churn prediction counts based on predicted_at."""
    now = datetime.now(timezone.utc)
    month_starts = []
    for i in range(months - 1, -1, -1):
        month_date = now - relativedelta(months=i)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_starts.append(month_start)

    month_keys = [(d.year, d.month) for d in month_starts]
    rows_by_month = {
        key: {'month': month_starts[idx].strftime('%b'), 'churn': 0, 'not_churn': 0}
        for idx, key in enumerate(month_keys)
    }

    from_date = month_starts[0]
    month_start_expr = func.date_trunc('month', ParticipationRisk.predicted_at)
    trend_rows = db.session.query(
        month_start_expr.label('month_start'),
        ParticipationRisk.will_churn,
        func.count(ParticipationRisk.id).label('total'),
    ).filter(
        ParticipationRisk.predicted_at >= from_date,
        ParticipationRisk.will_churn.isnot(None),
    ).group_by(
        month_start_expr,
        ParticipationRisk.will_churn,
    ).all()

    counts = defaultdict(lambda: {'churn': 0, 'not_churn': 0})
    for row in trend_rows:
        if not row.month_start:
            continue
        key = (row.month_start.year, row.month_start.month)
        if key in rows_by_month:
            if row.will_churn:
                counts[key]['churn'] += int(row.total or 0)
            else:
                counts[key]['not_churn'] += int(row.total or 0)

    for key, row in rows_by_month.items():
        row['churn'] = counts[key]['churn']
        row['not_churn'] = counts[key]['not_churn']

    return [rows_by_month[key] for key in month_keys]
