import ipaddress
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

SUPPORTED_RECORD_TYPES = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"}


def validate_dns_record_value(rec_type: str, val: str) -> str:
    """Validates record value formatting according to DNS record type rules."""
    val_clean = val.strip()
    if not val_clean:
        raise ValueError("Record value must not be empty or whitespace")

    rec_type_upper = rec_type.upper()

    if rec_type_upper == "A":
        try:
            ipaddress.IPv4Address(val_clean)
        except ValueError:
            raise ValueError(f"'{val_clean}' is not a valid IPv4 address for A record")

    elif rec_type_upper == "AAAA":
        try:
            ipaddress.IPv6Address(val_clean)
        except ValueError:
            raise ValueError(f"'{val_clean}' is not a valid IPv6 address for AAAA record")

    elif rec_type_upper == "MX":
        parts = val_clean.split(maxsplit=1)
        if len(parts) != 2:
            raise ValueError("MX record value must be in format '<priority> <hostname>' (e.g. '10 mail.example.com')")
        priority_str, hostname = parts
        try:
            priority = int(priority_str)
            if priority < 0:
                raise ValueError()
        except ValueError:
            raise ValueError(f"MX priority '{priority_str}' must be a non-negative integer")
        if not hostname.strip():
            raise ValueError("MX hostname must not be empty")

    elif rec_type_upper == "SRV":
        parts = val_clean.split(maxsplit=3)
        if len(parts) != 4:
            raise ValueError("SRV record value must be in format '<priority> <weight> <port> <target>' (e.g. '10 5 443 service.example.com')")
        pri_str, weight_str, port_str, target = parts
        try:
            pri = int(pri_str)
            if pri < 0:
                raise ValueError()
        except ValueError:
            raise ValueError(f"SRV priority '{pri_str}' must be a non-negative integer")
        try:
            weight = int(weight_str)
            if weight < 0:
                raise ValueError()
        except ValueError:
            raise ValueError(f"SRV weight '{weight_str}' must be a non-negative integer")
        try:
            port = int(port_str)
            if port < 0 or port > 65535:
                raise ValueError()
        except ValueError:
            raise ValueError(f"SRV port '{port_str}' must be an integer between 0 and 65535")
        if not target.strip():
            raise ValueError("SRV target must not be empty")

    elif rec_type_upper == "CAA":
        parts = val_clean.split(maxsplit=2)
        if len(parts) != 3:
            raise ValueError("CAA record value must be in format '<flags> <tag> <value>' (e.g. '0 issue letsencrypt.org')")
        flags_str, tag, caa_val = parts
        try:
            flags = int(flags_str)
            if flags < 0:
                raise ValueError()
        except ValueError:
            raise ValueError(f"CAA flags '{flags_str}' must be a non-negative integer")
        if not tag.strip():
            raise ValueError("CAA tag must not be empty")
        if not caa_val.strip():
            raise ValueError("CAA value must not be empty")

    elif rec_type_upper in ["CNAME", "NS", "PTR", "TXT"]:
        pass
    else:
        raise ValueError(f"Unsupported record type '{rec_type}'. Supported types: {', '.join(sorted(SUPPORTED_RECORD_TYPES))}")

    return val_clean


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


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User login email")
    password: str = Field(..., description="User login password")


class AuthResponse(BaseModel):
    message: str
    user: UserResponse
    access_token: str
    token_type: str = "bearer"


class HostedZoneBase(BaseModel):
    name: str = Field(..., min_length=1, description="Domain name (e.g. example.com)")
    zone_type: str = Field(..., min_length=1, description="Zone type ('Public' or 'Private')")
    description: Optional[str] = Field(None, description="Optional hosted zone description")
    private_zone: bool = Field(False, description="Whether this is a private hosted zone")

    @field_validator("name")
    @classmethod
    def normalize_domain_name(cls, v: str) -> str:
        cleaned = v.strip().lower().rstrip(".")
        if not cleaned:
            raise ValueError("Hosted zone name must not be empty or whitespace")
        return cleaned

    @field_validator("zone_type")
    @classmethod
    def validate_zone_type_str(cls, v: str) -> str:
        formatted = v.strip().capitalize()
        if formatted not in ["Public", "Private"]:
            raise ValueError("zone_type must be either 'Public' or 'Private'")
        return formatted

    @model_validator(mode="after")
    def validate_zone_privacy(self):
        if self.zone_type == "Public" and self.private_zone is True:
            raise ValueError("Public hosted zone cannot have private_zone=True")
        if self.zone_type == "Private":
            self.private_zone = True
        return self


class HostedZoneCreate(HostedZoneBase):
    pass


class HostedZoneUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    zone_type: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    private_zone: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def normalize_optional_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip().lower().rstrip(".")
        if not cleaned:
            raise ValueError("Hosted zone name must not be empty or whitespace")
        return cleaned

    @field_validator("zone_type")
    @classmethod
    def validate_optional_zone_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        formatted = v.strip().capitalize()
        if formatted not in ["Public", "Private"]:
            raise ValueError("zone_type must be either 'Public' or 'Private'")
        return formatted

    @model_validator(mode="after")
    def validate_update_privacy(self):
        if self.zone_type == "Public" and self.private_zone is True:
            raise ValueError("Public hosted zone cannot have private_zone=True")
        if self.zone_type == "Private" and self.private_zone is False:
            raise ValueError("Private hosted zone cannot have private_zone=False")
        return self


class HostedZoneResponse(HostedZoneBase):
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class HostedZoneListResponse(BaseModel):
    items: List[HostedZoneResponse]
    total: int
    page: int
    limit: int


class DNSRecordBase(BaseModel):
    name: str = Field(..., min_length=1, description="Record name (e.g. sub.example.com, www, @)")
    type: str = Field(..., min_length=1, description="DNS Record type (A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA)")
    ttl: int = Field(..., gt=0, description="Time to live in seconds (must be > 0)")
    value: str = Field(..., min_length=1, description="Record value")

    @field_validator("name")
    @classmethod
    def normalize_record_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Record name must not be empty or whitespace")
        return cleaned

    @field_validator("type")
    @classmethod
    def validate_and_uppercase_type(cls, v: str) -> str:
        type_upper = v.strip().upper()
        if type_upper not in SUPPORTED_RECORD_TYPES:
            raise ValueError(f"Unsupported record type '{v}'. Supported types: {', '.join(sorted(SUPPORTED_RECORD_TYPES))}")
        return type_upper

    @model_validator(mode="after")
    def validate_type_and_value(self):
        self.value = validate_dns_record_value(self.type, self.value)
        return self


class DNSRecordCreate(DNSRecordBase):
    pass


class DNSRecordUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    type: Optional[str] = Field(None, min_length=1)
    ttl: Optional[int] = Field(None, gt=0)
    value: Optional[str] = Field(None, min_length=1)

    @field_validator("name")
    @classmethod
    def normalize_optional_record_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Record name must not be empty or whitespace")
        return cleaned

    @field_validator("type")
    @classmethod
    def validate_optional_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        type_upper = v.strip().upper()
        if type_upper not in SUPPORTED_RECORD_TYPES:
            raise ValueError(f"Unsupported record type '{v}'. Supported types: {', '.join(sorted(SUPPORTED_RECORD_TYPES))}")
        return type_upper


class DNSRecordResponse(DNSRecordBase):
    id: int
    hosted_zone_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DNSRecordListResponse(BaseModel):
    items: List[DNSRecordResponse]
    total: int
    page: int
    limit: int
