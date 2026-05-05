"""
Feature calculation utilities for RFM (Recency, Frequency, Consistency).
Used by the ML service and backend for computing prediction features.
"""
from datetime import datetime, timezone


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


def calculate_consistency(deposit_list: list, period_months: int = 6) -> float:
    """
    Calculate consistency: ratio of active months to total observation months.
    An active month is a month that contains at least one deposit.

    Args:
        deposit_list: List of deposit records (each must have a 'created_at' or date field).
        period_months: Number of months in the observation period (default: 6).

    Returns:
        Consistency score between 0.0 and 1.0.
    """
    if not deposit_list or period_months <= 0:
        return 0.0

    now = datetime.now(timezone.utc)
    active_months = set()

    for deposit in deposit_list:
        # Support both dict and object formats
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

        active_months.add((dep_date.year, dep_date.month))

    consistency = len(active_months) / period_months
    return round(min(1.0, consistency), 4)
