import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, SessionLocal, Base
import app.models  # Ensures models are registered before metadata creation
from app.services.auth_service import init_dev_user
from app.routers import health, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database tables on application startup
    Base.metadata.create_all(bind=engine)

    # Initialize default development user if not already present
    db = SessionLocal()
    try:
        init_dev_user(db)
    finally:
        db.close()

    yield


app = FastAPI(
    title="AWS Route53 Clone API",
    description="Backend REST API for AWS Route53 Clone",
    version="0.4.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration for local development with credentials (cookies)
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular routers
app.include_router(health.router)
app.include_router(auth.router)
