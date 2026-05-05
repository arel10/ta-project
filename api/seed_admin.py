"""
Seed admin user only.

Usage:
    python seed_admin.py
    python seed_admin.py --email admin@dlh.padang.go.id --password admin123
"""

import argparse
import sys

try:
    from app import create_app, db
    from app.models.user import User
except ModuleNotFoundError as exc:
    print("[ERROR] Dependency belum terpasang di interpreter yang aktif:", exc)
    print("Aktifkan virtualenv backend lalu install requirements:")
    print("  .\\venv\\Scripts\\activate")
    print("  pip install -r requirements.txt")
    print("Lalu jalankan ulang:")
    print("  python seed_admin.py")
    sys.exit(1)


DEFAULT_NAME = "Admin DLH Padang"
DEFAULT_EMAIL = "admin@dlh.padang.go.id"
DEFAULT_PASSWORD = "admin123"
DEFAULT_ACCOUNT_NUMBER = "ADM-000001"
DEFAULT_LEVEL = "Admin"


def upsert_admin(
    name: str,
    email: str,
    password: str,
    account_number: str,
    reset_password: bool,
) -> None:
    """Create admin if not exists; optionally reset password when it already exists."""
    admin = User.query.filter_by(email=email).first()

    if not admin:
        admin = User(
            name=name,
            email=email,
            account_number=account_number,
            role="admin",
            level=DEFAULT_LEVEL,
            total_points=0,
        )
        admin.set_password(password)
        db.session.add(admin)
        db.session.commit()
        print(f"[OK] Admin created: {email} / {password}")
        return

    changed = False

    if admin.role != "admin":
        admin.role = "admin"
        changed = True

    if not admin.account_number:
        admin.account_number = account_number
        changed = True

    if reset_password:
        admin.set_password(password)
        changed = True

    if changed:
        db.session.commit()
        print(f"[OK] Admin updated: {email}")
    else:
        print(f"[INFO] Admin already exists and no changes applied: {email}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed admin user for Sirkula backend")
    parser.add_argument("--name", default=DEFAULT_NAME, help="Admin name")
    parser.add_argument("--email", default=DEFAULT_EMAIL, help="Admin email")
    parser.add_argument("--password", default=DEFAULT_PASSWORD, help="Admin password")
    parser.add_argument("--account-number", default=DEFAULT_ACCOUNT_NUMBER, help="Admin account number")
    parser.add_argument(
        "--reset-password",
        action="store_true",
        help="Reset password if the admin user already exists",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    app = create_app()

    with app.app_context():
        db.create_all()
        upsert_admin(
            name=args.name,
            email=args.email,
            password=args.password,
            account_number=args.account_number,
            reset_password=args.reset_password,
        )


if __name__ == "__main__":
    main()
