from typing import Optional, Tuple, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models import DNSRecord, HostedZone
from app.schemas import DNSRecordCreate, DNSRecordUpdate, validate_dns_record_value


def _verify_zone_ownership(db: Session, user_id: int, zone_id: int) -> HostedZone:
    """Verifies that the Hosted Zone exists and belongs to the authenticated user."""
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


def create_record(
    db: Session, user_id: int, zone_id: int, record_in: DNSRecordCreate
) -> DNSRecord:
    """Creates a new DNS Record within a user-owned Hosted Zone."""
    _verify_zone_ownership(db, user_id, zone_id)

    record = DNSRecord(
        hosted_zone_id=zone_id,
        name=record_in.name,
        type=record_in.type,
        ttl=record_in.ttl,
        value=record_in.value,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_records(
    db: Session,
    user_id: int,
    zone_id: int,
    search: Optional[str] = None,
    type_filter: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
) -> Tuple[List[DNSRecord], int]:
    """Lists, searches, filters, and paginates DNS Records inside a user-owned Hosted Zone."""
    _verify_zone_ownership(db, user_id, zone_id)

    query = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id)

    if search and search.strip():
        search_term = f"%{search.strip().lower()}%"
        query = query.filter(DNSRecord.name.ilike(search_term))

    if type_filter and type_filter.strip():
        query = query.filter(DNSRecord.type == type_filter.strip().upper())

    total = query.count()
    offset = (page - 1) * limit
    items = (
        query.order_by(DNSRecord.name.asc(), DNSRecord.type.asc(), DNSRecord.id.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return items, total


def get_record_by_id(db: Session, user_id: int, record_id: int) -> DNSRecord:
    """Fetches a single DNS Record verifying that its Hosted Zone belongs to the user."""
    record = (
        db.query(DNSRecord)
        .join(HostedZone, DNSRecord.hosted_zone_id == HostedZone.id)
        .filter(DNSRecord.id == record_id, HostedZone.user_id == user_id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="DNS record not found",
        )
    return record


def update_record(
    db: Session, user_id: int, record_id: int, record_in: DNSRecordUpdate
) -> DNSRecord:
    """Updates an existing DNS Record owned by the user after re-validating type/value rules."""
    record = get_record_by_id(db, user_id, record_id)

    new_type = record_in.type if record_in.type is not None else record.type
    new_value = record_in.value if record_in.value is not None else record.value

    # Re-validate target type & value combination
    try:
        validated_value = validate_dns_record_value(new_type, new_value)
    except ValueError as err:
        raise HTTPException(
            status_code=422,
            detail=str(err),
        )

    if record_in.name is not None:
        record.name = record_in.name
    if record_in.type is not None:
        record.type = new_type
    if record_in.ttl is not None:
        record.ttl = record_in.ttl
    record.value = validated_value

    db.commit()
    db.refresh(record)
    return record


def delete_record(db: Session, user_id: int, record_id: int) -> dict:
    """Deletes a DNS Record owned by the user."""
    record = get_record_by_id(db, user_id, record_id)
    db.delete(record)
    db.commit()
    return {"message": "DNS record deleted successfully"}
