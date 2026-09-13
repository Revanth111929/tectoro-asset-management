# utils/auth.py – Secure JWT Authentication Utilities
import jwt
import os
import sys
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from models import User

# P1-002: JWT Secret Key Validation
# Fail-fast if JWT secret is missing or insecure in production
JWT_SECRET = os.getenv('JWT_SECRET_KEY')
APP_ENV = os.getenv('APP_ENV', 'development')

# Production safety: require secure JWT secret
if not JWT_SECRET:
    if APP_ENV in ['production', 'render', 'office']:
        print("=" * 80, file=sys.stderr)
        print("FATAL: JWT_SECRET_KEY not found in environment", file=sys.stderr)
        print("", file=sys.stderr)
        print("Production applications MUST define JWT_SECRET_KEY in .env", file=sys.stderr)
        print("Generate a secure secret with:", file=sys.stderr)
        print("  python3 -c 'import secrets; print(secrets.token_urlsafe(32))'", file=sys.stderr)
        print("", file=sys.stderr)
        print("Then add to .env:", file=sys.stderr)
        print("  JWT_SECRET_KEY=<generated-secret>", file=sys.stderr)
        print("=" * 80, file=sys.stderr)
        sys.exit(1)
    else:
        # Development fallback (explicitly marked as insecure)
        JWT_SECRET = 'dev-insecure-jwt-secret-do-not-use-in-production'
        print("⚠️  WARNING: Using development JWT secret. NOT safe for production!", file=sys.stderr)

# Additional validation: reject known insecure defaults
INSECURE_SECRETS = [
    'your-jwt-secret-change-in-production',
    'change-me',
    'secret',
    'jwt-secret',
    'test-secret'
]

if JWT_SECRET.lower() in [s.lower() for s in INSECURE_SECRETS]:
    if APP_ENV in ['production', 'render', 'office']:
        print("=" * 80, file=sys.stderr)
        print(f"FATAL: JWT_SECRET_KEY contains insecure default value", file=sys.stderr)
        print("", file=sys.stderr)
        print("The current secret is a known insecure placeholder.", file=sys.stderr)
        print("Generate a new secure secret and update .env immediately.", file=sys.stderr)
        print("=" * 80, file=sys.stderr)
        sys.exit(1)
    else:
        print(f"⚠️  WARNING: JWT secret appears to be insecure default", file=sys.stderr)

JWT_ALGORITHM = 'HS256'
JWT_ACCESS_EXPIRATION = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))  # 1 hour
JWT_REFRESH_EXPIRATION = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 2592000))  # 30 days
JWT_MAX_SESSION_LIFETIME = int(os.getenv('JWT_MAX_SESSION_LIFETIME', 28800))  # 8 hours maximum session


def generate_access_token(user_id, username, role, session_start_time=None):
    """Generate JWT access token with session tracking"""
    import time

    # If no session_start_time provided, create new session
    if session_start_time is None:
        session_start_time = time.time()

    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'exp': datetime.utcnow() + timedelta(seconds=JWT_ACCESS_EXPIRATION),
        'iat': datetime.utcnow(),
        'type': 'access',
        'session_start_time': session_start_time  # Track original login time
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def generate_refresh_token(user_id, username, session_start_time=None):
    """Generate JWT refresh token with session tracking"""
    import time

    # If no session_start_time provided, create new session
    if session_start_time is None:
        session_start_time = time.time()

    payload = {
        'user_id': user_id,
        'username': username,
        'exp': datetime.utcnow() + timedelta(seconds=JWT_REFRESH_EXPIRATION),
        'iat': datetime.utcnow(),
        'type': 'refresh',
        'session_start_time': session_start_time  # Track original login time
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token):
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return {'error': 'Token has expired'}
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}


def get_token_from_header():
    """Extract token from Authorization header"""
    auth_header = request.headers.get('Authorization', '')

    # Must have Authorization header
    if not auth_header:
        return None

    # Must start with Bearer (case-sensitive for security)
    if not auth_header.startswith('Bearer '):
        return None

    # Extract token (must have content after "Bearer ")
    token = auth_header[7:].strip()
    if not token or len(token) == 0:
        return None

    # Token must have minimum length (JWT has 3 parts separated by dots)
    if len(token) < 20 or token.count('.') != 2:
        return None

    # Each part must not be empty
    parts = token.split('.')
    if any(not part or len(part) < 2 for part in parts):
        return None

    return token


def get_current_user():
    """Get current user from JWT token"""
    token = get_token_from_header()
    if not token:
        return None

    payload = decode_token(token)
    if 'error' in payload:
        return None

    return {
        'id': payload.get('user_id'),
        'username': payload.get('username'),
        'role': payload.get('role')
    }


def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        payload = decode_token(token)
        if 'error' in payload:
            return jsonify({'error': payload['error']}), 401

        # Attach user info to request
        request.current_user = {
            'id': payload.get('user_id'),
            'username': payload.get('username'),
            'role': payload.get('role')
        }

        return f(*args, **kwargs)

    return decorated


def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        user = request.current_user
        if user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)

    return decorated


def role_required(*roles):
    """Decorator to require specific role(s)"""
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            user = request.current_user
            if user.get('role') not in roles:
                return jsonify({'error': f'Access denied. Required role: {", ".join(roles)}'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


def non_viewer_required(f):
    """Decorator to block viewer role (allows admin and user)"""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        user = request.current_user
        if user.get('role') == 'viewer':
            return jsonify({'error': 'Access denied. Viewers cannot perform this action.'}), 403
        return f(*args, **kwargs)

    return decorated
