# utils/limiter.py — shared Limiter instance so routes.py can decorate
# individual endpoints without a circular import against app.py.
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

# Create limiter instance (will be initialized with app later)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    storage_uri='memory://',
    enabled=True
)
