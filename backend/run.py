"""
Sirkula Backend — Entry Point.

Development:
    python run.py

Production:
    gunicorn --bind 127.0.0.1:5000 --workers 3 --timeout 120 "app:create_app()"
"""
import os
from app import create_app

app = create_app()

if __name__ == '__main__':
    debug = os.getenv('FLASK_DEBUG', '0') == '1'
    app.run(host='0.0.0.0', port=5000, debug=debug)
