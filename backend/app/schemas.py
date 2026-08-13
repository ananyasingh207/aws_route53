from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ==========================================
# USER SCHEMAS
# ==========================================


class UserBase(BaseModel):
    name: str = Field(..., min_length=1, description="User full name")
    email: EmailStr = Field(..., description="User email address")

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name must not consist entirely of whitespace")
        return v.strip()


class UserCreate(UserBase):
    password: str = Field(..., min_length=1, description="User raw password")

    @field_validator("password")
    @classmethod
    def password_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("password must not consist entirely of whitespace")
        return v


class UserResponse(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# AUTHENTICATION SCHEMAS
# ==========================================


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User login email")
    password: str = Field(..., description="User login password")


class AuthResponse(BaseModel):
    message: str
    user: UserResponse


# ==========================================
# HOSTED ZONE SCHEMAS
# ==========================================


class HostedZoneBase(BaseModel):
    name: str = Field(..., min_length=1, description="Domain name (e.g. example.com)")
    zone_type: str = Field(..., min_length=1, description="Zone type (e.g. Public / Private)")
    description: Optional[str] = Field(None, description="Optional hosted zone description")
    private_zone: bool = Field(False, description="Whether this is a private hosted zone")

    @field_validator("name", "zone_type")
    @classmethod
    def fields_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("field must not consist entirely of whitespace")
        return v.strip()


class HostedZoneCreate(HostedZoneBase):
    pass


class HostedZoneUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    zone_type: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    private_zone: Optional[bool] = None

    @field_validator("name", "zone_type")
    @classmethod
    def optional_fields_must_not_be_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("field must not consist entirely of whitespace")
        return v.strip() if v is not None else None


class HostedZoneResponse(HostedZoneBase):
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# DNS RECORD SCHEMAS
# ==========================================


class DNSRecordBase(BaseModel):
    name: str = Field(..., min_length=1, description="Record name (e.g. sub.example.com)")
    type: str = Field(..., min_length=1, description="DNS Record type (e.g. A, CNAME, TXT)")
    ttl: int = Field(..., gt=0, description="Time to live in seconds (must be > 0)")
    value: str = Field(..., min_length=1, description="Record value (e.g. IP address or target)")

    @field_validator("name", "type", "value")
    @classmethod
    def record_fields_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("field must not consist entirely of whitespace")
        return v.strip()


class DNSRecordCreate(DNSRecordBase):
    pass


class DNSRecordUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    type: Optional[str] = Field(None, min_length=1)
    ttl: Optional[int] = Field(None, gt=0)
    value: Optional[str] = Field(None, min_length=1)

    @field_validator("name", "type", "value")
    @classmethod
    def optional_record_fields_must_not_be_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("field must not consist entirely of whitespace")
        return v.strip() if v is not None else None


class DNSRecordResponse(DNSRecordBase):
    id: int
    hosted_zone_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
