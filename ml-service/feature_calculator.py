"""
Feature calculation utilities for churn prediction.
Computes 8 features: recency, frequency, consistency,
avg_interval, std_interval, avg_berat, trend_berat, days_active.
"""
from datetime import datetime, timezone
import numpy as np


def calculate_recency(last_deposit_date: datetime) -> int:
    """
    Calculate recency: days since the last deposit.

    Args:
        last_deposit_date: datetime of the most recent deposit.

    Returns:
        Number of days since the last deposit.
    """
    if last_deposit_date is None:
        return 999  # No deposits → very high recency

    now = datetime.now(timezone.utc)
    if last_deposit_date.tzinfo is None:
        last_deposit_date = last_deposit_date.replace(tzinfo=timezone.utc)

    delta = now - last_deposit_date
    return max(0, delta.days)


def calculate_frequency(deposit_list: list) -> int:
    """
    Calculate frequency: total number of (validated) deposits.

    Args:
        deposit_list: List of deposit records.

    Returns:
        Count of deposits.
    """
    if not deposit_list:
        return 0
    return len(deposit_list)


def calculate_consistency(deposit_list: list) -> float:
    """
    Calculate consistency: ratio of second-half activity vs first-half activity.

    Args:
        deposit_list: List of deposit records with 'created_at' field.

    Returns:
        Consistency score (0.5 for single deposit, higher = more recent activity).
    """
    if not deposit_list or len(deposit_list) < 2:
        return 0.5

    timestamps = []
    for deposit in deposit_list:
        if isinstance(deposit, dict):
            dep_date = deposit.get('created_at') or deposit.get('date')
        else:
            dep_date = getattr(deposit, 'created_at', None)

        if dep_date is None:
            continue
        if isinstance(dep_date, str):
            dep_date = datetime.fromisoformat(dep_date)
        if dep_date.tzinfo is None:
            dep_date = dep_date.replace(tzinfo=timezone.utc)
        timestamps.append(dep_date)

    if len(timestamps) < 2:
        return 0.5

    timestamps.sort()
    start = timestamps[0]
    end = timestamps[-1]
    mid_time = start + (end - start) / 2

    n_awal = sum(1 for t in timestamps if t < mid_time)
    n_akhir = sum(1 for t in timestamps if t >= mid_time)

    return round(n_akhir / (n_awal + 1), 4)


def calculate_intervals(deposit_list: list) -> tuple[float, float]:
    """
    Calculate average and standard deviation of intervals between deposits.

    Args:
        deposit_list: List of deposit records with 'created_at' field.

    Returns:
        Tuple of (avg_interval, std_interval) in days.
    """
    if not deposit_list or len(deposit_list) < 2:
        return 0.0, 0.0

    timestamps = []
    for deposit in deposit_list:
        if isinstance(deposit, dict):
            dep_date = deposit.get('created_at') or deposit.get('date')
        else:
            dep_date = getattr(deposit, 'created_at', None)

        if dep_date is None:
            continue
        if isinstance(dep_date, str):
            dep_date = datetime.fromisoformat(dep_date)
        if dep_date.tzinfo is None:
            dep_date = dep_date.replace(tzinfo=timezone.utc)
        timestamps.append(dep_date)

    if len(timestamps) < 2:
        return 0.0, 0.0

    timestamps.sort()
    intervals = [(timestamps[i] - timestamps[i - 1]).days for i in range(1, len(timestamps))]

    avg_interval = float(np.mean(intervals))
    std_interval = float(np.std(intervals, ddof=1)) if len(intervals) > 1 else 0.0

    return round(avg_interval, 2), round(std_interval, 2)


def calculate_weight_features(deposit_list: list) -> tuple[float, float]:
    """
    Calculate average weight and weight trend.

    Args:
        deposit_list: List of deposit records with 'weight_kg' field.

    Returns:
        Tuple of (avg_berat, trend_berat).
    """
    if not deposit_list:
        return 0.0, 0.0

    weights = []
    for deposit in deposit_list:
        if isinstance(deposit, dict):
            w = deposit.get('weight_kg', 0)
        else:
            w = getattr(deposit, 'weight_kg', 0)
        weights.append(float(w or 0))

    if not weights:
        return 0.0, 0.0

    avg_berat = float(np.mean(weights))

    if len(weights) >= 2:
        x = np.arange(len(weights))
        slope = float(np.polyfit(x, weights, 1)[0])
    else:
        slope = 0.0

    return round(avg_berat, 4), round(slope, 4)


def calculate_days_active(deposit_list: list) -> int:
    """
    Calculate days active: span from first to last deposit.

    Args:
        deposit_list: List of deposit records with 'created_at' field.

    Returns:
        Number of days from first to last deposit.
    """
    if not deposit_list or len(deposit_list) < 2:
        return 0

    timestamps = []
    for deposit in deposit_list:
        if isinstance(deposit, dict):
            dep_date = deposit.get('created_at') or deposit.get('date')
        else:
            dep_date = getattr(deposit, 'created_at', None)

        if dep_date is None:
            continue
        if isinstance(dep_date, str):
            dep_date = datetime.fromisoformat(dep_date)
        if dep_date.tzinfo is None:
            dep_date = dep_date.replace(tzinfo=timezone.utc)
        timestamps.append(dep_date)

    if len(timestamps) < 2:
        return 0

    timestamps.sort()
    return (timestamps[-1] - timestamps[0]).days
