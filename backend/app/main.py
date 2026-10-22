"""
BrandProof FastAPI Application Factory.

Configures:
  - CORS middleware for React / Vite frontend.
  - Global standard response error handlers.
  - Health check & API v1 router mount points.
"""

from app.config import get_settings
from app.middleware.error_handler import register_error_handlers
from app.api import auth, rules, facts, terms, assets, users, org, content, review_engine, collaboration, notifications, insights

settings = get_settings()

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    def create_app() -> FastAPI:
        """Create and configure the FastAPI application instance."""
        app = FastAPI(
            title="BrandProof API",
            description="Intelligent Brand Governance & Proof Engine Backend",
            version="1.0.0",
            docs_url="/docs",
            redoc_url="/redoc"
        )

        # 1. CORS Configuration (T-010)
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins_list,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # 2. Register Global Error Handlers (T-011)
        register_error_handlers(app)

        # 3. Root & Health Check Endpoints
        @app.get("/", tags=["System"])
        async def root():
            return {
                "success": True,
                "data": {
                    "service": "brandproof-backend",
                    "status": "online",
                    "version": "1.0.0",
                    "docs": "/docs",
                    "health": "/health"
                },
                "error": None,
                "meta": None
            }

        @app.get("/health", tags=["System"])
        async def health_check():
            return {
                "success": True,
                "data": {
                    "status": "healthy",
                    "service": "brandproof-backend",
                    "environment": settings.environment
                },
                "error": None,
                "meta": None
            }

        # 4. Mount API v1 Routers
        api_v1_prefix = "/api/v1"
        app.include_router(auth.router, prefix=api_v1_prefix)
        app.include_router(rules.router, prefix=api_v1_prefix)
        app.include_router(facts.router, prefix=api_v1_prefix)
        app.include_router(terms.router, prefix=api_v1_prefix)
        app.include_router(assets.router, prefix=api_v1_prefix)
        app.include_router(users.router, prefix=api_v1_prefix)
        app.include_router(org.router, prefix=api_v1_prefix)
        app.include_router(content.router, prefix=api_v1_prefix)
        app.include_router(review_engine.router, prefix=api_v1_prefix)
        app.include_router(collaboration.router, prefix=api_v1_prefix)
        app.include_router(notifications.router, prefix=api_v1_prefix)
        app.include_router(insights.router, prefix=api_v1_prefix)

        return app

    app = create_app()

except ImportError:
    # Stub for environments before fastapi is installed
    def create_app():
        return None

    app = None
