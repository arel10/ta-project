import os
from flask import Flask
from werkzeug.exceptions import RequestEntityTooLarge, HTTPException
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_marshmallow import Marshmallow

from config import config_by_name
from app.utils.api_response import error_response

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
ma = Marshmallow()


def create_app(config_name=None):
    """Application factory pattern."""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    ma.init_app(app)

    # CORS — allow Next.js and Flutter
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config.get('CORS_ORIGINS', ['*']),
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
        }
    })

    # Import models so Alembic can detect them
    from app.models import user, waste_deposit, mission, badge, reward, participation_risk, waste_point_rate, point_setting  # noqa: F401

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.deposits import deposits_bp
    from app.routes.gamification import gamification_bp
    from app.routes.rewards import rewards_bp
    from app.routes.admin import admin_bp
    from app.routes.ml import ml_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(deposits_bp, url_prefix='/api/deposits')
    app.register_blueprint(gamification_bp, url_prefix='/api/gamification')
    app.register_blueprint(rewards_bp, url_prefix='/api/rewards')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(ml_bp, url_prefix='/api/ml')

    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return error_response("Token telah kedaluwarsa", "token_expired", status=401)

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return error_response("Token tidak valid", "invalid_token", status=401)

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return error_response("Token tidak ditemukan", "authorization_required", status=401)

    # Health check
    @app.route('/api/health')
    def health_check():
        return {"status": "healthy", "service": "sirkula-backend"}

    @app.errorhandler(RequestEntityTooLarge)
    def handle_file_too_large(_error):
        return error_response("Ukuran file melebihi batas maksimal 5MB", "payload_too_large", status=413)

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        code = (error.name or "http_error").lower().replace(" ", "_")
        return error_response(error.description or "Request error", code, status=error.code)

    @app.errorhandler(Exception)
    def handle_unexpected_error(_error):
        return error_response("Terjadi kesalahan pada server", "internal_error", status=500)

    return app
