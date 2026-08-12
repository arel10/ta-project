import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()
_env_name = os.getenv('FLASK_ENV', 'development')
_env_file = f'.env.{_env_name}'
if os.path.exists(_env_file):
    load_dotenv(_env_file)


class Config:
    """Base configuration."""
    _default_jwt_secret = 'dev-secret-key-please-change-to-32-bytes-min'
    SECRET_KEY = os.getenv('JWT_SECRET_KEY', _default_jwt_secret)
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql+psycopg://user:password@localhost:5432/sirkula').replace(
        'postgresql://', 'postgresql+psycopg://'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_size': 10,
        'max_overflow': 20,
    }

    # JWT Config
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', _default_jwt_secret)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers']

    # ML Service
    ML_SERVICE_URL = os.getenv('ML_SERVICE_URL', 'http://localhost:5001')

    # CORS
    _cors_origins_env = os.getenv('CORS_ORIGINS')
    if _cors_origins_env:
        CORS_ORIGINS = [origin.strip() for origin in _cors_origins_env.split(',') if origin.strip()]
    else:
        # Development fallback — overridden in production via CORS_ORIGINS env var
        CORS_ORIGINS = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        ]

    # File Uploads
    # Keep request limit slightly above file limit to account for multipart overhead.
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', str(6 * 1024 * 1024)))
    MAX_REWARD_IMAGE_SIZE = int(os.getenv('MAX_REWARD_IMAGE_SIZE', str(5 * 1024 * 1024)))
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', os.path.join(os.getcwd(), 'uploads'))


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_ECHO = True


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    SQLALCHEMY_ECHO = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'


config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
}
