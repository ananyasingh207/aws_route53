# AWS Route 53 Clone — API Contract Reference

This document serves as the official REST API contract reference for frontend integration. All endpoints strictly enforce user data isolation based on the authenticated session.

---

## 1. Global Overview

- **Base URL**: `http://localhost:8000`
- **API Prefix**: `/api`
- **Swagger Documentation**: `http://localhost:8000/docs`
- **OpenAPI Schema**: `http://localhost:8000/openapi.json`
- **Authentication**: Session cookie named `route53_session` (`HttpOnly`, `SameSite=Lax`, `Path=/`). Tokens are **never** returned in JSON or stored in `localStorage`.
- **CORS**: Configured for `http://localhost:3000` with `allow_credentials=True`.

---

## 2. Standard Response Schemas

### Pagination Response Format
Collection endpoints (`GET /api/hosted-zones`, `GET /api/hosted-zones/{zone_id}/records`) follow this wrapper structure:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 10
}
```

### Standard Deletion Response
```json
{
  "message": "Resource deleted successfully"
}
```

### Standard Error Response Format
```json
{
  "detail": "Human-readable error explanation"
}
```

---

## 3. Endpoints Reference

### 🏥 Health Check

#### `GET /api/health`
- **Auth Required**: No
- **Response**: `200 OK`
  ```json
  {
    "status": "ok"
  }
  ```

---

### 🔑 Authentication

#### `POST /api/auth/login`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "password"
  }
  ```
- **Response**: `200 OK` + Sets `route53_session` HttpOnly cookie
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": 1,
      "name": "Route53 Administrator",
      "email": "admin@example.com",
      "created_at": "2026-08-13T19:50:00Z"
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{"detail": "Invalid email or password"}`
  - `422 Unprocessable Entity`: Validation failure.

#### `GET /api/auth/me`
- **Auth Required**: Yes (Cookie `route53_session`)
- **Response**: `200 OK`
  ```json
  {
    "id": 1,
    "name": "Route53 Administrator",
    "email": "admin@example.com",
    "created_at": "2026-08-13T19:50:00Z"
  }
  ```
- **Error Response**:
  - `401 Unauthorized`: `{"detail": "Not authenticated"}` or `{"detail": "Invalid session or expired token"}`

#### `POST /api/auth/logout`
- **Auth Required**: No (Clears cookie if present)
- **Response**: `200 OK` + Clears `route53_session` cookie
  ```json
  {
    "message": "Logout successful"
  }
  ```

---

### 🌐 Hosted Zones

#### `POST /api/hosted-zones`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "example.com",
    "zone_type": "Public",
    "description": "Primary domain",
    "private_zone": false
  }
  ```
  *(Note: Domain name is automatically stripped & lowercased. `zone_type` must be `"Public"` or `"Private"`. `private_zone` must align with `zone_type`.)*
- **Response**: `201 Created`
  ```json
  {
    "id": 1,
    "name": "example.com",
    "zone_type": "Public",
    "description": "Primary domain",
    "private_zone": false,
    "created_at": "2026-08-13T19:50:00Z",
    "updated_at": "2026-08-13T19:50:00Z",
    "user_id": 1
  }
  ```
- **Error Responses**:
  - `409 Conflict`: `{"detail": "Hosted zone with this name already exists"}`
  - `422 Unprocessable Entity`: Contradictory privacy flags or invalid zone type.

#### `GET /api/hosted-zones`
- **Auth Required**: Yes
- **Query Parameters**:
  - `search` *(optional str)*: Case-insensitive search on zone name.
  - `page` *(optional int, default 1, min 1)*: Page number.
  - `limit` *(optional int, default 10, min 1, max 100)*: Items per page.
- **Response**: `200 OK`
  ```json
  {
    "items": [
      {
        "id": 1,
        "name": "example.com",
        "zone_type": "Public",
        "description": "Primary domain",
        "private_zone": false,
        "created_at": "2026-08-13T19:50:00Z",
        "updated_at": "2026-08-13T19:50:00Z",
        "user_id": 1
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
  ```

#### `GET /api/hosted-zones/{id}`
- **Auth Required**: Yes
- **Response**: `200 OK` (HostedZoneResponse)
- **Error Response**:
  - `404 Not Found`: `{"detail": "Hosted zone not found"}` (Returned if zone does not exist or belongs to another user).

#### `PUT /api/hosted-zones/{id}`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "newname.com",
    "description": "Updated description"
  }
  ```
- **Response**: `200 OK` (HostedZoneResponse)
- **Error Responses**:
  - `404 Not Found`: `{"detail": "Hosted zone not found"}`
  - `409 Conflict`: `{"detail": "Another hosted zone with this name already exists"}`

#### `DELETE /api/hosted-zones/{id}`
- **Auth Required**: Yes
- **Response**: `200 OK`
  ```json
  {
    "message": "Hosted zone deleted successfully"
  }
  ```
- **Error Response**:
  - `404 Not Found`: `{"detail": "Hosted zone not found"}`

---

### 📝 DNS Records

#### `POST /api/hosted-zones/{zone_id}/records`
- **Auth Required**: Yes
- **Request Body Examples**:
  - **A Record**: `{"name": "www", "type": "A", "ttl": 300, "value": "192.168.1.10"}`
  - **AAAA Record**: `{"name": "v6", "type": "AAAA", "ttl": 300, "value": "2001:db8::1"}`
  - **CNAME Record**: `{"name": "alias", "type": "CNAME", "ttl": 600, "value": "www.example.com"}`
  - **TXT Record**: `{"name": "@", "type": "TXT", "ttl": 300, "value": "v=spf1 include:_spf.example.com ~all"}`
  - **MX Record**: `{"name": "@", "type": "MX", "ttl": 300, "value": "10 mail.example.com"}`
  - **NS Record**: `{"name": "@", "type": "NS", "ttl": 86400, "value": "ns1.example.com"}`
  - **PTR Record**: `{"name": "ptr", "type": "PTR", "ttl": 300, "value": "host.example.com"}`
  - **SRV Record**: `{"name": "_sip._tcp", "type": "SRV", "ttl": 300, "value": "10 60 5060 service.example.com"}`
  - **CAA Record**: `{"name": "@", "type": "CAA", "ttl": 300, "value": "0 issue letsencrypt.org"}`
- **Response**: `201 Created`
  ```json
  {
    "id": 1,
    "hosted_zone_id": 1,
    "name": "www",
    "type": "A",
    "ttl": 300,
    "value": "192.168.1.10",
    "created_at": "2026-08-13T19:50:00Z",
    "updated_at": "2026-08-13T19:50:00Z"
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Parent Hosted Zone not found or not owned by current user.
  - `422 Unprocessable Entity`: Invalid IP address, invalid TTL `<= 0`, malformed MX/SRV/CAA syntax, or unsupported record type.

#### `GET /api/hosted-zones/{zone_id}/records`
- **Auth Required**: Yes
- **Query Parameters**:
  - `search` *(optional str)*: Substring match on record name.
  - `type` *(optional str)*: Filter by record type (e.g. `A`, `MX`). Case-insensitive.
  - `page` *(optional int, default 1, min 1)*: Page number.
  - `limit` *(optional int, default 10, min 1, max 100)*: Items per page.
- **Response**: `200 OK`
  ```json
  {
    "items": [
      {
        "id": 1,
        "hosted_zone_id": 1,
        "name": "www",
        "type": "A",
        "ttl": 300,
        "value": "192.168.1.10",
        "created_at": "2026-08-13T19:50:00Z",
        "updated_at": "2026-08-13T19:50:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
  ```

#### `GET /api/records/{id}`
- **Auth Required**: Yes
- **Response**: `200 OK` (DNSRecordResponse)
- **Error Response**:
  - `404 Not Found`: `{"detail": "DNS record not found"}`

#### `PUT /api/records/{id}`
- **Auth Required**: Yes
- **Request Body**: `{"name": "newname", "type": "AAAA", "ttl": 600, "value": "2001:db8::2"}`
- **Response**: `200 OK` (DNSRecordResponse)
- **Error Responses**:
  - `404 Not Found`: Record not found or not owned.
  - `422 Unprocessable Entity`: Value formatting validation failed for target record type.

#### `DELETE /api/records/{id}`
- **Auth Required**: Yes
- **Response**: `200 OK`
  ```json
  {
    "message": "DNS record deleted successfully"
  }
  ```
- **Error Response**:
  - `404 Not Found`: `{"detail": "DNS record not found"}`

---

## 4. HTTP Status Code Summary

| Status Code | Meaning | Occurrences |
| :--- | :--- | :--- |
| **200 OK** | Success | GET, PUT, DELETE, Login, Logout operations |
| **201 Created** | Resource Created | POST Hosted Zones & DNS Records |
| **401 Unauthorized** | Unauthenticated | Missing/invalid cookie, invalid login credentials |
| **404 Not Found** | Not Found / Access Denied | Zone or record does not exist or belongs to another user |
| **409 Conflict** | Duplicate Resource | Duplicate Hosted Zone name for the same user |
| **422 Unprocessable Entity** | Validation Error | Invalid payload format, invalid IP, bad TTL, invalid type |
