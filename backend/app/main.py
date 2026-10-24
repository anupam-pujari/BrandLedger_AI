"""
BrandProof FastAPI Application Factory.

Configures:
  - High-performance CORS middleware for Vite / React frontend.
  - Global standard response error handlers.
  - Consolidated API v1 domain router mounts:
      * Auth, Users & Org Settings (/api/v1/auth, /api/v1/users, /api/v1/org)
      * Source of Truth Knowledge Layer (/api/v1/rules, /api/v1/facts, /api/v1/terms, /api/v1/assets)
      * Content Governance & Review Engine (/api/v1/content)
      * Rule Health & Insights (/api/v1/insights, /api/v1/notifications)
"""

import sys
from pathlib import Path

# Ensure backend directory is in sys.path for serverless runtimes
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import get_settings
from app.schemas import BrandProofException
from app.api import auth, knowledge, content, insights

settings = get_settings()


def create_app() -> FastAPI:
    """Create and configure the consolidated BrandProof FastAPI application."""
    app = FastAPI(
        title="BrandProof API",
        description="Intelligent Brand Governance & Proof Engine Backend",
        version="2.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # 1. CORS Configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_origin_regex=r"https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 2. Standard Global Error Handlers
    @app.exception_handler(BrandProofException)
    async def handle_domain_exception(request: Request, exc: BrandProofException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "data": None,
                "error": {
                    "code": exc.error_code,
                    "message": exc.message,
                    "details": exc.details,
                },
                "meta": None,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "data": None,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request payload validation failed.",
                    "details": {"errors": exc.errors()},
                },
                "meta": None,
            },
        )

    @app.exception_handler(Exception)
    async def handle_uncaught_exception(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "data": None,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(exc) if settings.environment == "development" else "An unexpected server error occurred.",
                    "details": {},
                },
                "meta": None,
            },
        )

    # 3. System & Health Check Endpoints
    @app.get("/", tags=["System"])
    async def root():
        return {
            "success": True,
            "data": {
                "service": "brandproof-backend",
                "status": "online",
                "version": "2.0.0",
                "docs": "/docs",
                "health": "/health",
            },
            "error": None,
            "meta": None,
        }

    @app.get("/health", tags=["System"])
    async def health_check():
        return {
            "success": True,
            "data": {
                "status": "healthy",
                "service": "brandproof-backend",
                "environment": settings.environment,
            },
            "error": None,
            "meta": None,
        }

    # 4. Mount Consolidated API v1 Domain Routers
    api_v1_prefix = "/api/v1"
    app.include_router(auth.router, prefix=api_v1_prefix)
    app.include_router(knowledge.router, prefix=api_v1_prefix)
    app.include_router(content.router, prefix=api_v1_prefix)
    app.include_router(insights.router, prefix=api_v1_prefix)

    return app


app = create_app()
