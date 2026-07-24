# utils/rate_limit.py – Rate limiting configuration
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

def init_limiter(app):
    """Initialize rate limiter with app"""
    enabled = os.getenv('RATELIMIT_ENABLED', 'True') == 'True'
    
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        storage_uri=os.getenv('RATELIMIT_STORAGE_URL', 'memory://'),
        default_limits=["200 per day", "50 per hour"] if enabled else [],
        enabled=enabled,
        headers_enabled=True,
    )
    
    return limiter

# Rate limit decorators for common scenarios
def limit_login():
    """Rate limit for login attempts"""
    return "5 per minute"

def limit_api():
    """Rate limit for general API calls"""
    return "60 per minute"

def limit_expensive():
    """Rate limit for expensive operations (exports, imports)"""
    return "10 per minute"
