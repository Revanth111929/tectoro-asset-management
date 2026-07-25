# utils/auth.py – Secure JWT Authentication Utilities
import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from models import User

# Configuration
JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_ACCESS_EXPIRATION = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))  # 1 hour
JWT_REFRESH_EXPIRATION = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 2592000))  # 30 days


def generate_access_token(user_id, username, role):
    """Generate JWT access token"""
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'exp': datetime.utcnow() + timedelta(seconds=JWT_ACCESS_EXPIRATION),
        'iat': datetime.utcnow(),
        'type': 'access'
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def generate_refresh_token(user_id, username):
    """Generate JWT refresh token"""
    payload = {
        'user_id': user_id,
        'username': username,
        'exp': datetime.utcnow() + timedelta(seconds=JWT_REFRESH_EXPIRATION),
        'iat': datetime.utcnow(),
        'type': 'refresh'
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
