"""
test_agmarknet_client.py — tests for official Agmarknet API client resilience:
  • Pagination and multi-page results
  • Timeout and 429 rate-limit handling with retries
  • Malformed JSON & empty responses
  • Secret redaction
  • In-memory caching
All external requests are mocked.
"""
from __future__ import annotations

import json
import pytest
import httpx
from unittest.mock import AsyncMock, patch, MagicMock

from app import config
from app.services import agmarknet


@pytest.mark.asyncio
async def test_pagination_multi_page():
    """Verify that fetch_agmarknet_records continues fetching across multiple pages."""
    agmarknet.clear_cache()

    page1_records = [
        {
            "state": "Uttar Pradesh",
            "district": "Agra",
            "market": "Agra Grain Market",
            "commodity": "Wheat",
            "variety": "Lokwan",
            "arrival_date": "21/10/2026",
            "min_price": "1800",
            "max_price": "2200",
            "modal_price": "2000",
        }
    ]
    page2_records = [
        {
            "state": "Uttar Pradesh",
            "district": "Agra",
            "market": "Achhnera",
            "commodity": "Wheat",
            "variety": "Dara",
            "arrival_date": "21/10/2026",
            "min_price": "1850",
            "max_price": "2150",
            "modal_price": "2050",
        }
    ]

    resp1 = MagicMock(spec=httpx.Response)
    resp1.status_code = 200
    resp1.json.return_value = {"total": 2, "records": page1_records}
    resp1.raise_for_status = MagicMock()

    resp2 = MagicMock(spec=httpx.Response)
    resp2.status_code = 200
    resp2.json.return_value = {"total": 2, "records": page2_records}
    resp2.raise_for_status = MagicMock()

    client_mock = AsyncMock(spec=httpx.AsyncClient)
    client_mock.__aenter__.return_value = client_mock
    client_mock.get.side_effect = [resp1, resp2]

    with patch("httpx.AsyncClient", return_value=client_mock):
        results = await agmarknet.fetch_agmarknet_records(
            commodity="Wheat",
            district="Agra",
            api_key="TEST_API_KEY_123456",
            limit_per_page=1,
            max_records=10,
        )

    assert len(results) == 2
    mandis = [r["mandi"] for r in results]
    assert "Agra Grain Market" in mandis
    assert "Achhnera" in mandis
    assert client_mock.get.call_count == 2


@pytest.mark.asyncio
async def test_api_rate_limit_429_backoff():
    """Verify 429 rate limit triggers retry and succeeds on subsequent try."""
    agmarknet.clear_cache()

    resp_429 = MagicMock(spec=httpx.Response)
    resp_429.status_code = 429

    resp_200 = MagicMock(spec=httpx.Response)
    resp_200.status_code = 200
    resp_200.json.return_value = {
        "total": 1,
        "records": [
            {
                "state": "Maharashtra",
                "district": "Nashik",
                "market": "Lasalgaon",
                "commodity": "Onion",
                "arrival_date": "21/10/2026",
                "modal_price": "1500",
            }
        ],
    }
    resp_200.raise_for_status = MagicMock()

    client_mock = AsyncMock(spec=httpx.AsyncClient)
    client_mock.__aenter__.return_value = client_mock
    client_mock.get.side_effect = [resp_429, resp_200]

    with patch("httpx.AsyncClient", return_value=client_mock), patch("asyncio.sleep", new_callable=AsyncMock):
        results = await agmarknet.fetch_agmarknet_records(
            commodity="Onion",
            district="Nashik",
            api_key="TEST_KEY",
        )

    assert len(results) == 1
    assert results[0]["mandi"] == "Lasalgaon"
    assert client_mock.get.call_count == 2


@pytest.mark.asyncio
async def test_api_timeout_retries_and_raises():
    """Verify transient timeouts retry up to max_retries."""
    agmarknet.clear_cache()

    client_mock = AsyncMock(spec=httpx.AsyncClient)
    client_mock.__aenter__.return_value = client_mock
    client_mock.get.side_effect = httpx.TimeoutException("Connection timed out")

    with patch("httpx.AsyncClient", return_value=client_mock), patch("asyncio.sleep", new_callable=AsyncMock):
        with pytest.raises(httpx.TimeoutException):
            await agmarknet.fetch_agmarknet_records(
                commodity="Wheat",
                api_key="TEST_KEY",
            )


@pytest.mark.asyncio
async def test_malformed_json_handled_gracefully():
    """Verify invalid JSON returns empty list instead of crashing."""
    agmarknet.clear_cache()

    bad_resp = MagicMock(spec=httpx.Response)
    bad_resp.status_code = 200
    bad_resp.json.side_effect = json.JSONDecodeError("Expecting value", "bad json", 0)
    bad_resp.raise_for_status = MagicMock()

    client_mock = AsyncMock(spec=httpx.AsyncClient)
    client_mock.__aenter__.return_value = client_mock
    client_mock.get.return_value = bad_resp

    with patch("httpx.AsyncClient", return_value=client_mock):
        results = await agmarknet.fetch_agmarknet_records(
            commodity="Wheat",
            api_key="TEST_KEY",
        )

    assert results == []


@pytest.mark.asyncio
async def test_empty_api_records():
    """Verify empty response is handled smoothly."""
    agmarknet.clear_cache()

    resp = MagicMock(spec=httpx.Response)
    resp.status_code = 200
    resp.json.return_value = {"total": 0, "records": []}
    resp.raise_for_status = MagicMock()

    client_mock = AsyncMock(spec=httpx.AsyncClient)
    client_mock.__aenter__.return_value = client_mock
    client_mock.get.return_value = resp

    with patch("httpx.AsyncClient", return_value=client_mock):
        results = await agmarknet.fetch_agmarknet_records(
            commodity="Wheat",
            api_key="TEST_KEY",
        )

    assert results == []


def test_secret_redaction_and_masking():
    """Verify secret is never exposed in logs or diagnostics."""
    secret = "my_super_secret_gov_key_987654"
    masked = config.mask_secret(secret)
    assert secret not in masked
    assert masked.startswith("my_")
    assert masked.endswith("654")
    assert "..." in masked


@pytest.mark.asyncio
async def test_in_memory_cache_hit():
    """Verify identical queries within TTL return from cache without re-hitting API."""
    agmarknet.clear_cache()

    resp = MagicMock(spec=httpx.Response)
    resp.status_code = 200
    resp.json.return_value = {
        "total": 1,
        "records": [
            {
                "state": "Punjab",
                "district": "Amritsar",
                "market": "Amritsar Grain",
                "commodity": "Wheat",
                "arrival_date": "21/10/2026",
                "modal_price": "2100",
            }
        ],
    }
    resp.raise_for_status = MagicMock()

    client_mock = AsyncMock(spec=httpx.AsyncClient)
    client_mock.__aenter__.return_value = client_mock
    client_mock.get.return_value = resp

    with patch("httpx.AsyncClient", return_value=client_mock):
        # 1st call: hits mock API
        res1 = await agmarknet.fetch_agmarknet_records(
            commodity="Wheat",
            district="Amritsar",
            api_key="TEST_KEY",
        )
        assert len(res1) == 1
        assert client_mock.get.call_count == 1

        # 2nd call: should hit cache
        res2 = await agmarknet.fetch_agmarknet_records(
            commodity="Wheat",
            district="Amritsar",
            api_key="TEST_KEY",
        )
        assert len(res2) == 1
        # call_count should still be 1 (served from cache)
        assert client_mock.get.call_count == 1
