from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health", summary="Health check endpoint")
async def health_check():
    return {"status": "ok"}
