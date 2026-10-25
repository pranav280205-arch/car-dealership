"""Entry point for the Car Dealership Inventory API."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import Base, engine
from app.routers import auth, inventory, vehicles
from app.services.errors import DomainError


def create_app() -> FastAPI:
    app = FastAPI(title="Car Dealership Inventory API", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(DomainError)
    def handle_domain_error(_: Request, exc: DomainError):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    app.include_router(auth.router)
    app.include_router(vehicles.router)
    app.include_router(inventory.router)
    return app


Base.metadata.create_all(bind=engine)
app = create_app()
