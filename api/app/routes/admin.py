"""Admin route bootstrap.

The actual endpoints are split by domain under app.routes.admin_sections.
"""

from flask import Blueprint

admin_bp = Blueprint('admin', __name__)

# Import route modules for their side effects so all handlers register on admin_bp.
from app.routes.admin import data_management, dashboard, gamification, members, missions, public, rewards  # noqa: E402,F401