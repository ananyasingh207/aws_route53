import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

from app.database import engine, SessionLocal, Base
import app.models  # Ensures models are registered before metadata creation
from app.services.auth_service import init_root_user
from app.routers import health, auth, hosted_zones, records


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database tables on application startup
    Base.metadata.create_all(bind=engine)

    # Initialize root user from environment configuration if not present
    db = SessionLocal()
    try:
        init_root_user(db)
    finally:
        db.close()

    yield


app = FastAPI(
    title="AWS Route53 Clone API",
    description="Backend REST API for AWS Route53 Clone",
    version="0.6.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

from app.config import CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(hosted_zones.router)
app.include_router(records.router)
