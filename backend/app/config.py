import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

# 1. JWT Configuration (Security Sensitive)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not JWT_SECRET_KEY:
    # Allow pytest execution to proceed with a dedicated test secret if not explicitly set
    if (
        "pytest" in sys.modules
        or "PYTEST_CURRENT_TEST" in os.environ
        or any("pytest" in arg for arg in sys.argv)
    ):
        JWT_SECRET_KEY = "test-secret-key-for-pytest-execution-32chars"
    else:
        raise RuntimeError(
            "CRITICAL CONFIGURATION ERROR: 'JWT_SECRET_KEY' environment variable is missing. "
            "Please set JWT_SECRET_KEY in your environment or .env file."
        )

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(
        os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )
except ValueError:
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 2. Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./route53.db")

# 3. CORS Configuration
CORS_ORIGINS_RAW = os.getenv(
    "CORS_ORIGINS", "http://localhost:3000,https://aws-route53-red.vercel.app"
)
CORS_ORIGINS = [
    origin.strip() for origin in CORS_ORIGINS_RAW.split(",") if origin.strip()
]

# 4. Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
try:
    PORT = int(os.getenv("PORT", "8000"))
except ValueError:
    PORT = 8000

# 5. Root User Initialization Configuration
ROOT_USER_NAME = os.getenv("ROOT_USER_NAME", "Route53 Administrator")
ROOT_USER_EMAIL = os.getenv("ROOT_USER_EMAIL", "admin@example.com")
ROOT_USER_PASSWORD = os.getenv("ROOT_USER_PASSWORD", "password")

# 6. Cookie Security Configuration
# In cross-site production deployments (e.g. Vercel https://... -> Render https://...),
# SameSite must be "none" and Secure must be True.
# In local HTTP development, SameSite can be "lax" and Secure can be False.
_is_render = "RENDER" in os.environ or "RENDER_SERVICE_ID" in os.environ
_has_https_origin = any(origin.startswith("https://") for origin in CORS_ORIGINS)

_cookie_samesite_default = "none" if (_is_render or _has_https_origin) else "lax"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", _cookie_samesite_default).lower()

_cookie_secure_env = os.getenv("COOKIE_SECURE")
if _cookie_secure_env is not None:
    COOKIE_SECURE = _cookie_secure_env.lower() in ("true", "1", "yes")
else:
    COOKIE_SECURE = True if (_is_render or _has_https_origin) else False


