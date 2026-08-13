# AWS Route 53 Clone

A mocked AWS Route 53 console experience built with modern web technologies. This project reproduces the look and feel of the AWS Route 53 interface for learning and demonstration purposes. It does not interface with real AWS services or provide real DNS functionality.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python, SQLAlchemy 2.x, Pydantic v2
- **Database**: SQLite (`backend/route53.db`)
- **Testing**: `pytest`, FastAPI `TestClient`, `httpx`
- **API**: REST APIs

## API Documentation & Contract

- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **OpenAPI JSON Spec**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)
- **Frontend API Contract Reference**: [docs/api-contract.md](file:///c:/Users/HP/Documents/Projects/aws_route53_clone/docs/api-contract.md)

## Authentication (Mocked)

The application uses an HttpOnly cookie-based session architecture (`route53_session`) with signed JWT tokens and password hashing (Argon2 / Bcrypt).

### Local Development Credentials
> **IMPORTANT**: These credentials are automatically initialized for local development and testing only. **Do not use in production!**

- **Email**: `admin@example.com`
- **Password**: `password`
- **User Name**: `Route53 Administrator`

### Authentication Endpoints
- `POST /api/auth/login` — Authenticates email/password and sets `route53_session` HttpOnly cookie.
- `GET /api/auth/me` — Protected endpoint returning the current user profile (requires `route53_session` cookie).
- `POST /api/auth/logout` — Clears the `route53_session` cookie.

## Hosted Zones API

All Hosted Zone endpoints require authentication via the `route53_session` HttpOnly cookie and enforce strict user data isolation.

### Endpoints
- `POST /api/hosted-zones` — Creates a new Hosted Zone owned by the authenticated user.
- `GET /api/hosted-zones` — Lists, searches, and paginates Hosted Zones belonging to the user.
- `GET /api/hosted-zones/{id}` — Retrieves details of a specific Hosted Zone (`404 Not Found` if not owned).
- `PUT /api/hosted-zones/{id}` — Updates an existing Hosted Zone (`409 Conflict` on duplicate names).
- `DELETE /api/hosted-zones/{id}` — Deletes a Hosted Zone owned by the user (cascades to associated DNS records).

## DNS Records API

DNS Record endpoints manage records inside user-owned Hosted Zones. Every operation verifies that the parent Hosted Zone belongs to the authenticated user.

### Supported Record Types
`A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, `SRV`, `CAA`

### Endpoints
- `POST /api/hosted-zones/{zone_id}/records` — Creates a new DNS Record inside the specified Hosted Zone.
- `GET /api/hosted-zones/{zone_id}/records` — Lists, searches (`search`), filters by type (`type`), and paginates (`page`, `limit`) records in the zone.
- `GET /api/records/{id}` — Retrieves an individual DNS Record (`404 Not Found` if not owned).
- `PUT /api/records/{id}` — Updates an existing DNS Record (re-validates type/value formatting).
- `DELETE /api/records/{id}` — Deletes an individual DNS Record.

## Project Structure

```
route53-clone/
├── frontend/             # Next.js TypeScript web application
│   ├── app/              # Next.js App Router pages and layout
│   ├── components/       # UI components
│   ├── lib/              # Utility functions and shared helpers
│   └── public/           # Static assets
├── backend/              # FastAPI Python backend application
│   ├── app/              # Core application logic
│   │   ├── main.py       # FastAPI entry point & CORS configuration
│   │   ├── database.py   # SQLAlchemy 2.x engine & session setup
│   │   ├── models.py     # User, HostedZone, DNSRecord DB models
│   │   ├── schemas.py    # Pydantic v2 schemas & DNS validators
│   │   ├── dependencies.py # FastAPI dependency injections (get_db, get_current_user)
│   │   ├── routers/      # API route modules (health.py, auth.py, hosted_zones.py, records.py)
│   │   └── services/     # Business services (auth_service.py, hosted_zone_service.py, record_service.py)
│   ├── tests/            # Automated pytest integration suite
│   │   ├── conftest.py   # Test DB setup & fixtures
│   │   ├── test_health.py
│   │   ├── test_auth.py
│   │   ├── test_hosted_zones.py
│   │   ├── test_records.py
│   │   └── test_integration.py
│   ├── route53.db        # SQLite database file
│   ├── requirements.txt  # Python dependencies
│   └── .env.example      # Sample environment variable settings
├── docs/                 # Documentation & API contract specs
│   └── api-contract.md   # Stable REST API contract reference
├── .gitignore            # Root Git ignore rules
└── README.md             # Project documentation
```

## Backend Testing Instructions

Automated integration tests use an isolated, temporary SQLite test database (`test_route53.db`) so that the development database (`route53.db`) is never modified or touched.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run pytest suite:
   ```bash
   pytest -v
   ```

3. Run compilation check:
   ```bash
   python -m compileall app tests
   ```

## Frontend Setup Instructions

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

## Backend Setup Instructions

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On Linux / macOS:
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. Open `http://localhost:8000/docs` in your browser for Swagger API documentation.

## Local URLs

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend Base API**: [http://localhost:8000](http://localhost:8000)
- **Backend Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

## Current Project Status

> **Phase 7 Complete (Backend Integration Testing + API Contract Lock)**: Full backend test suite (`pytest -v`) covering health, auth, hosted zones, DNS records, multi-tenant isolation, cascade deletion, and database persistence is 100% passing. The REST API contract is locked in `docs/api-contract.md`.
