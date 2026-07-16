"""Admin route package.

This package exposes the admin blueprint and imports the section modules so
their route decorators register on the shared blueprint.
"""

from flask import Blueprint

admin_bp = Blueprint('admin', __name__)

from app.routes.admin import data_management, dashboard, gamification, members, missions, public, rewards  # noqa: E402,F401
