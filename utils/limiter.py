# utils/limiter.py — shared Limiter instance so routes.py can decorate
# individual endpoints without a circular import against app.py.
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(get_remote_address, default_limits=[])
