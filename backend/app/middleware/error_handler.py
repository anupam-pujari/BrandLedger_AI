"""
BrandProof Global Error Handler Middleware.

Converts domain exceptions and uncaught server errors into standard API envelope responses.
"""

import logging
from typing import Any, Dict
from app.models.common import BrandProofException

logger = logging.getLogger("brandproof.errors")


def create_error_response(code: str, message: str, details: Dict[str, Any] | None = None) -> Dict[str, Any]:
    """Format dictionary conforming to API contract standard error envelope."""
    return {
        "success": False,
        "data": None,
        "error": {
            "code": code,
            "message": message,
            "details": details or {}
        },
        "meta": None
    }


def register_error_handlers(app: Any) -> None:
    """Register FastAPI global exception handlers."""
    try:
        from fastapi import Request
        from fastapi.responses import JSONResponse
        from fastapi.exceptions import RequestValidationError

        @app.exception_handler(BrandProofException)
        async def handle_domain_exception(request: Request, exc: BrandProofException):
            return JSONResponse(
                status_code=exc.status_code,
                content=create_error_response(exc.error_code, exc.message, exc.details)
            )

        @app.exception_handler(RequestValidationError)
        async def handle_validation_error(request: Request, exc: RequestValidationError):
            return JSONResponse(
                status_code=422,
                content=create_error_response(
                    code="VALIDATION_ERROR",
                    message="Request payload validation failed.",
                    details={"errors": exc.errors()}
                )
            )

        @app.exception_handler(Exception)
        async def handle_uncaught_exception(request: Request, exc: Exception):
            logger.error(f"Uncaught Server Error: {str(exc)}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content=create_error_response(
                    code="INTERNAL_ERROR",
                    message="An unexpected server error occurred."
                )
            )

    except ImportError:
        pass
