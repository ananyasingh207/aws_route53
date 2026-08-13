from typing import Optional, Tuple, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models import HostedZone
from app.schemas import HostedZoneCreate, HostedZoneUpdate


def create_zone(db: Session, user_id: int, zone_in: HostedZoneCreate) -> HostedZone:
    """Creates a new Hosted Zone for the authenticated user after checking duplicate names."""
    existing = (
        db.query(HostedZone)
        .filter(HostedZone.user_id == user_id, HostedZone.name == zone_in.name)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Hosted zone with this name already exists",
        )

    new_zone = HostedZone(
        name=zone_in.name,
        zone_type=zone_in.zone_type,
        description=zone_in.description,
        private_zone=zone_in.private_zone,
        user_id=user_id,
    )
    db.add(new_zone)
    db.commit()
    db.refresh(new_zone)
    return new_zone


def list_zones(
    db: Session,
    user_id: int,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
) -> Tuple[List[HostedZone], int]:
    """Lists, searches, and paginates Hosted Zones belonging exclusively to the authenticated user."""
    query = db.query(HostedZone).filter(HostedZone.user_id == user_id)

    if search and search.strip():
        search_term = f"%{search.strip().lower()}%"
        query = query.filter(HostedZone.name.ilike(search_term))

    total = query.count()
    offset = (page - 1) * limit
    items = (
        query.order_by(HostedZone.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return items, total


def get_zone_by_id(db: Session, user_id: int, zone_id: int) -> HostedZone:
    """Fetches a single Hosted Zone owned by the authenticated user."""
    zone = (
        db.query(HostedZone)
        .filter(HostedZone.id == zone_id, HostedZone.user_id == user_id)
        .first()
    )
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hosted zone not found",
        )
    return zone


def update_zone(
    db: Session, user_id: int, zone_id: int, zone_in: HostedZoneUpdate
) -> HostedZone:
    """Updates a Hosted Zone owned by the user after checking for duplicate names."""
    zone = get_zone_by_id(db, user_id, zone_id)

    if zone_in.name is not None and zone_in.name != zone.name:
        existing = (
            db.query(HostedZone)
            .filter(
                HostedZone.user_id == user_id,
                HostedZone.name == zone_in.name,
                HostedZone.id != zone_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another hosted zone with this name already exists",
            )
        zone.name = zone_in.name

    if zone_in.zone_type is not None:
        zone.zone_type = zone_in.zone_type
    if zone_in.description is not None:
        zone.description = zone_in.description
    if zone_in.private_zone is not None:
        zone.private_zone = zone_in.private_zone

    db.commit()
    db.refresh(zone)
    return zone


def delete_zone(db: Session, user_id: int, zone_id: int) -> dict:
    """Deletes a Hosted Zone owned by the user."""
    zone = get_zone_by_id(db, user_id, zone_id)
    db.delete(zone)
    db.commit()
    return {"message": "Hosted zone deleted successfully"}
