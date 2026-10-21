"""
Date utility helpers for MandiSaarthi.
"""
from datetime import date, timedelta


def parse_date(date_str: str) -> date:
    """Parse an ISO 8601 date string (YYYY-MM-DD) to a date object."""
    return date.fromisoformat(date_str)


def is_stale(reported: date) -> bool:
    """True when the reported date is before today."""
    return reported < date.today()


def days_since(reported: date) -> int:
    """Number of calendar days between reported date and today."""
    return (date.today() - reported).days


def date_range(days: int) -> list[date]:
    """
    Returns a list of *days* consecutive dates ending today (inclusive).
    Example: date_range(3) → [today-2, today-1, today]
    """
    today = date.today()
    return [today - timedelta(days=i) for i in range(days - 1, -1, -1)]
