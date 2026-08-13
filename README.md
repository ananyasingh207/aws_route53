# AWS Route 53 Clone

A mocked AWS Route 53 console experience built with modern web technologies. This project reproduces the look and feel of the AWS Route 53 interface for learning and demonstration purposes. It does not interface with real AWS services or provide real DNS functionality.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python, SQLAlchemy 2.x, Pydantic v2
- **Database**: SQLite (`backend/route53.db`)
- **API**: REST APIs

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
  - Body: `{"name": "example.com", "zone_type": "Public", "description": "My domain", "private_zone": false}`
  - Rejects duplicate names for the same user with `409 Conflict`.
- `GET /api/hosted-zones` — Lists, searches, and paginates Hosted Zones belonging to the user.
  - Query Params: `search` (case-insensitive substring search), `page` (default 1), `limit` (default 10, max 100).
  - Response: `{"items": [...], "total": 25, "page": 1, "limit": 10}`
- `GET /api/hosted-zones/{id}` — Retrieves details of a specific Hosted Zone. Returns `404 Not Found` if the zone does not exist or belongs to another user.
- `PUT /api/hosted-zones/{id}` — Updates an existing Hosted Zone. Checks for duplicate names within the user's zones (`409 Conflict`).
- `DELETE /api/hosted-zones/{id}` — Deletes a Hosted Zone owned by the user (cascades to associated records).

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
│   │   ├── schemas.py    # Pydantic v2 schemas
│   │   ├── dependencies.py # FastAPI dependency injections (get_db, get_current_user)
│   │   ├── routers/      # API route modules (health.py, auth.py, hosted_zones.py)
│   │   └── services/     # Business services (auth_service.py, hosted_zone_service.py)
│   ├── route53.db        # SQLite database file
│   ├── requirements.txt  # Python dependencies
│   └── .env.example      # Sample environment variable settings
├── .gitignore            # Root Git ignore rules
└── README.md             # Project documentation
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

> **Phase 5 Complete (Hosted Zones Backend CRUD)**: Full REST API for Hosted Zones with domain name normalization, duplicate name protection, user data isolation, search, and pagination is complete. DNS Records CRUD endpoints have **not** yet been implemented.
