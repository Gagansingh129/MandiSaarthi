"""
main.py — FastAPI application entry point for MandiSaarthi backend.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.services import csv_store
from app.routers import prices, meta, data
from app.models.schemas import HealthResponse
from app.services.data_resolver import get_source


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the CSV store on startup; nothing to clean up on shutdown."""
    csv_store.load()
    yield


app = FastAPI(
    title="MandiSaarthi API",
    description="Agricultural mandi price intelligence backend.",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(prices.router, prefix="/api/v1/prices")
app.include_router(meta.router, prefix="/api/v1/meta")
app.include_router(data.router, prefix="/api/v1/data")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse, tags=["health"])
@app.get("/api/v1/health", response_model=HealthResponse, tags=["health"])
def health() -> HealthResponse:
    """Returns service health status and CSV row count."""
    return HealthResponse(
        status="ok",
        data_source=get_source(),
        csv_rows=csv_store.row_count(),
    )
