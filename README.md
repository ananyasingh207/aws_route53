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
│   │   ├── routers/      # API route modules (health.py, auth.py)
│   │   └── services/     # Business services (auth_service.py)
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

> **Phase 4 Complete (Mock Authentication)**: SQLite database layer, Pydantic v2 schemas, and HttpOnly JWT authentication (login, logout, current-user profile, dev user initialization) are fully implemented. Hosted Zones CRUD and DNS Records CRUD endpoints have **not** yet been implemented.
