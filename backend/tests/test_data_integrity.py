"""
test_data_integrity.py — data quality checks against the cleaned CSV.
"""
from __future__ import annotations

from datetime import date
from pathlib import Path

import pandas as pd
import pytest

# ---------------------------------------------------------------------------
# Helpers / Fixtures
# ---------------------------------------------------------------------------

CLEANED_CSV = Path(__file__).resolve().parent.parent / "data" / "cleaned" / "mandi_prices.csv"
FIXTURE_CSV = Path(__file__).resolve().parent.parent / "data" / "fixtures" / "test_prices.csv"


def _load(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, encoding="utf-8", dtype={"no_rate_reported": str}, keep_default_na=False)
    df["no_rate_reported"] = df["no_rate_reported"].str.strip().str.lower() == "true"
    for col in ("min_price", "max_price", "modal_price"):
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df["reported_date"] = pd.to_datetime(df["reported_date"], format="%Y-%m-%d").dt.date
    return df


@pytest.fixture(scope="module")
def cleaned_df() -> pd.DataFrame:
    return _load(CLEANED_CSV)


@pytest.fixture(scope="module")
def fixture_df() -> pd.DataFrame:
    return _load(FIXTURE_CSV)


# ---------------------------------------------------------------------------
# Tests on cleaned CSV
# ---------------------------------------------------------------------------


def test_no_future_dates(cleaned_df: pd.DataFrame) -> None:
    today = date.today()
    future_rows = cleaned_df[cleaned_df["reported_date"] > today]
    assert future_rows.empty, f"Found {len(future_rows)} row(s) with future dates: {future_rows['reported_date'].tolist()}"


def test_no_null_price_when_rate_reported(cleaned_df: pd.DataFrame) -> None:
    """When no_rate_reported=False, modal_price must not be null."""
    reported = cleaned_df[~cleaned_df["no_rate_reported"]]
    null_modal = reported[reported["modal_price"].isna()]
    assert null_modal.empty, (
        f"{len(null_modal)} row(s) with no_rate_reported=False have null modal_price."
    )


def test_no_price_when_no_rate_reported(cleaned_df: pd.DataFrame) -> None:
    """When no_rate_reported=True, modal_price must be null."""
    no_rate = cleaned_df[cleaned_df["no_rate_reported"]]
    has_price = no_rate[no_rate["modal_price"].notna()]
    assert has_price.empty, (
        f"{len(has_price)} row(s) with no_rate_reported=True still have a modal_price."
    )


def test_all_prices_positive(cleaned_df: pd.DataFrame) -> None:
    """All non-null prices must be strictly positive."""
    for col in ("min_price", "max_price", "modal_price"):
        non_null = cleaned_df[cleaned_df[col].notna()]
        bad = non_null[non_null[col] <= 0]
        assert bad.empty, f"Found non-positive {col} values: {bad[col].tolist()}"


def test_price_unit_consistent(cleaned_df: pd.DataFrame) -> None:
    """price_unit must be 'INR/Quintal' wherever it is set."""
    with_unit = cleaned_df[cleaned_df["price_unit"] != ""]
    bad = with_unit[with_unit["price_unit"] != "INR/Quintal"]
    assert bad.empty, f"Unexpected price_unit values: {bad['price_unit'].unique().tolist()}"


def test_no_exact_duplicates(cleaned_df: pd.DataFrame) -> None:
    dupes = cleaned_df[cleaned_df.duplicated()]
    assert dupes.empty, f"Found {len(dupes)} exact duplicate row(s)."


def test_valid_source_values(cleaned_df: pd.DataFrame) -> None:
    valid = {"Agmarknet", "Synthetic-Test"}
    actual = set(cleaned_df["source"].unique())
    invalid = actual - valid
    assert not invalid, f"Invalid source values found: {invalid}"


def test_fixture_labelled_synthetic(fixture_df: pd.DataFrame) -> None:
    """All rows in the test fixture must have source='Synthetic-Test'."""
    non_synthetic = fixture_df[fixture_df["source"] != "Synthetic-Test"]
    assert non_synthetic.empty, (
        f"{len(non_synthetic)} fixture row(s) have source != 'Synthetic-Test': "
        f"{non_synthetic['source'].unique().tolist()}"
    )
