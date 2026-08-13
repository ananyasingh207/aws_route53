from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import User
from app.schemas import (
    DNSRecordCreate,
    DNSRecordListResponse,
    DNSRecordResponse,
    DNSRecordUpdate,
)
from app.services import record_service

router = APIRouter(prefix="/api", tags=["DNS Records"])


@router.post(
    "/hosted-zones/{zone_id}/records",
    response_model=DNSRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new DNS Record inside a Hosted Zone",
)
async def create_record(
    zone_id: int,
    record_in: DNSRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = record_service.create_record(db, current_user.id, zone_id, record_in)
    return DNSRecordResponse.model_validate(record)


@router.get(
    "/hosted-zones/{zone_id}/records",
    response_model=DNSRecordListResponse,
    summary="List, search, filter, and paginate DNS Records in a Hosted Zone",
)
async def list_records(
    zone_id: int,
    search: Optional[str] = Query(None, description="Search term matching record name"),
    type: Optional[str] = Query(None, description="Filter by record type (e.g. A, MX)"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(10, ge=1, le=100, description="Items per page (max 100)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = record_service.list_records(
        db, current_user.id, zone_id, search=search, type_filter=type, page=page, limit=limit
    )
    return DNSRecordListResponse(
        items=[DNSRecordResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        limit=limit,
    )


@router.get(
    "/records/{id}",
    response_model=DNSRecordResponse,
    summary="Get details of an individual DNS Record",
)
async def get_record(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = record_service.get_record_by_id(db, current_user.id, id)
    return DNSRecordResponse.model_validate(record)


@router.put(
    "/records/{id}",
    response_model=DNSRecordResponse,
    summary="Update an existing DNS Record",
)
async def update_record(
    id: int,
    record_in: DNSRecordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = record_service.update_record(db, current_user.id, id, record_in)
    return DNSRecordResponse.model_validate(record)


@router.delete(
    "/records/{id}",
    summary="Delete a DNS Record",
)
async def delete_record(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return record_service.delete_record(db, current_user.id, id)
