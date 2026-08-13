from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import User
from app.schemas import (
    HostedZoneCreate,
    HostedZoneListResponse,
    HostedZoneResponse,
    HostedZoneUpdate,
)
from app.services import hosted_zone_service

router = APIRouter(prefix="/api/hosted-zones", tags=["Hosted Zones"])


@router.post(
    "",
    response_model=HostedZoneResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Hosted Zone",
)
async def create_hosted_zone(
    zone_in: HostedZoneCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    zone = hosted_zone_service.create_zone(db, current_user.id, zone_in)
    return HostedZoneResponse.model_validate(zone)


@router.get(
    "",
    response_model=HostedZoneListResponse,
    summary="List, search, and paginate Hosted Zones owned by the authenticated user",
)
async def list_hosted_zones(
    search: Optional[str] = Query(None, description="Search term for hosted zone name"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(10, ge=1, le=100, description="Items per page (max 100)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = hosted_zone_service.list_zones(
        db, current_user.id, search=search, page=page, limit=limit
    )
    return HostedZoneListResponse(
        items=[HostedZoneResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        limit=limit,
    )


@router.get(
    "/{id}",
    response_model=HostedZoneResponse,
    summary="Get details of a single Hosted Zone",
)
async def get_hosted_zone(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    zone = hosted_zone_service.get_zone_by_id(db, current_user.id, id)
    return HostedZoneResponse.model_validate(zone)


@router.put(
    "/{id}",
    response_model=HostedZoneResponse,
    summary="Update an existing Hosted Zone",
)
async def update_hosted_zone(
    id: int,
    zone_in: HostedZoneUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    zone = hosted_zone_service.update_zone(db, current_user.id, id, zone_in)
    return HostedZoneResponse.model_validate(zone)


@router.delete(
    "/{id}",
    summary="Delete a Hosted Zone",
)
async def delete_hosted_zone(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return hosted_zone_service.delete_zone(db, current_user.id, id)
