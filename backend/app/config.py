"""
MandiSaarthi – application configuration.
Uses python-dotenv to read values from .env (or environment).
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend root (two levels up from this file)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)


def _bool(value: str, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in ("1", "true", "yes")


# Read API key from DATA_GOV_IN_API_KEY (primary) or AGMARKNET_API_KEY (legacy alias)
DATA_GOV_IN_API_KEY: str = (
    os.getenv("DATA_GOV_IN_API_KEY")
    or os.getenv("AGMARKNET_API_KEY")
    or ""
).strip()

# Legacy alias for backward compatibility
AGMARKNET_API_KEY: str = DATA_GOV_IN_API_KEY

# Official data.gov.in Agmarknet Current Daily Price resource URL
# Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
AGMARKNET_API_URL: str = os.getenv(
    "AGMARKNET_API_URL",
    "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070",
).strip()

FORCE_CSV_MODE: bool = _bool(os.getenv("FORCE_CSV_MODE"), default=False if DATA_GOV_IN_API_KEY else True)

# Timeout and retry settings
API_CONNECT_TIMEOUT: float = float(os.getenv("API_CONNECT_TIMEOUT", "5.0"))
API_READ_TIMEOUT: float = float(os.getenv("API_READ_TIMEOUT", "15.0"))
API_MAX_RETRIES: int = int(os.getenv("API_MAX_RETRIES", "3"))
CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "600"))  # 10 minutes

ALLOWED_ORIGINS: list[str] = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if o.strip()
]


def mask_secret(secret: str) -> str:
    """Mask a secret string for safe logging and diagnostic display."""
    if not secret:
        return ""
    if len(secret) <= 6:
        return "***"
    return f"{secret[:3]}...{secret[-3:]}"


def get_api_key_diagnostic() -> dict:
    """Return diagnostic info about API key configuration without revealing the secret."""
    if not DATA_GOV_IN_API_KEY:
        return {
            "configured": False,
            "status": "missing",
            "message": "DATA_GOV_IN_API_KEY is not configured. Running on verified offline snapshot.",
            "masked_key": None,
        }
    return {
        "configured": True,
        "status": "configured",
        "message": "Official API key configured.",
        "masked_key": mask_secret(DATA_GOV_IN_API_KEY),
    }

