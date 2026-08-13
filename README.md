# AWS Route 53 Clone

A mocked AWS Route 53 console experience built with modern web technologies. This project reproduces the look and feel of the AWS Route 53 interface for learning and demonstration purposes. It does not interface with real AWS services or provide real DNS functionality.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, AWS Cloudscape Design System
- **Backend**: FastAPI, Python, SQLAlchemy 2.x, Pydantic v2
- **Database**: SQLite (`backend/route53.db`)
- **Testing**: `pytest`, FastAPI `TestClient`, `httpx`
- **API**: REST APIs

## API Documentation & Contract

- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **OpenAPI JSON Spec**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)
- **Frontend API Contract Reference**: [docs/api-contract.md](file:///c:/Users/HP/Documents/Projects/aws_route53_clone/docs/api-contract.md)

## Authentication Architecture

The application uses an HttpOnly cookie-based session architecture (`route53_session`) with signed JWT tokens on the backend. All frontend API requests include `credentials: "include"`. Tokens are never exposed to or stored in JavaScript (`localStorage` / `sessionStorage`).

### Local Development Credentials
> **IMPORTANT**: These credentials are automatically initialized for local development and testing only. **Do not use in production!**

- **Email**: `admin@example.com`
- **Password**: `password`
- **User Name**: `Route53 Administrator`

### Authentication Endpoints & Frontend Integration
- `POST /api/auth/login` — Authenticates email/password and sets `route53_session` HttpOnly cookie.
- `GET /api/auth/me` — Protected session verification returning the current user profile.
- `POST /api/auth/logout` — Clears the `route53_session` HttpOnly cookie.
- **Login UI Route**: [http://localhost:3000/login](http://localhost:3000/login)

## Hosted Zones API & Console Integration

All Hosted Zone endpoints require authentication via the `route53_session` HttpOnly cookie and enforce strict user data isolation.

### Console Features ([http://localhost:3000/hosted-zones](http://localhost:3000/hosted-zones))
- **Live Data Listing**: Real-time table powered by `GET /api/hosted-zones`.
- **Debounced Search**: ~300ms debounced server-side search input.
- **Server Pagination**: Collection preferences supporting page sizes 10, 20, 50, and 100.
- **Create Hosted Zone**: Modal form supporting domain name, description, and Public/Private zone type. Displays `409 Conflict` alert on duplicate names.
- **Edit Hosted Zone**: Modal form prefilled with zone data updating backend via `PUT /api/hosted-zones/{id}`.
- **Delete Hosted Zone**: Modal confirmation explicitly warning: *"Deleting a hosted zone also deletes all of its associated DNS records."*

### Backend Endpoints
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
├── frontend/             # Next.js TypeScript web application (Cloudscape Design System)
│   ├── app/              # Next.js App Router pages (/login, /dashboard, /hosted-zones)
│   ├── components/       # App shell & route protection (ConsoleShell.tsx, ProtectedRoute.tsx)
│   ├── context/          # React Auth Context (AuthContext.tsx)
│   ├── lib/              # API fetch helper (api.ts)
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
│   ├── tests/            # Automated pytest integration suite (local-only)
│   ├── route53.db        # SQLite database file
│   └── requirements.txt  # Python dependencies
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
- **Frontend Hosted Zones**: [http://localhost:3000/hosted-zones](http://localhost:3000/hosted-zones)
- **Backend Base API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

## Current Project Status

> **Phase 10 Complete (Hosted Zones UI + API Integration)**: Full Cloudscape Hosted Zones console (`/hosted-zones`) connected to FastAPI backend REST API (`/api/hosted-zones`). Supports real data listing, debounced search, server pagination, collection preferences, Create, Edit, Delete modals (with DNS record cascade warning), Flashbar notifications, and error alerts.
