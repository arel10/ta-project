"""
Database initialization and seeding script.
Run this to create all tables and insert initial data.

Usage:
    python init_db.py
"""
from datetime import datetime, timedelta, timezone

from app import create_app, db
from app.models.user import User
from app.models.mission import Mission
from app.models.badge import Badge, UserBadge
from app.models.reward import Reward
from app.models.waste_deposit import WasteDeposit
from app.services.gamification_service import calculate_points, calculate_user_level
from app.services.gamification_service import ensure_waste_point_rates_seeded, ensure_point_settings_seeded


def _award_badges_for_user(user_id):
    """Assign eligible badges for a user based on validated deposits and points."""
    user = User.query.get(user_id)
    if not user:
        return 0

    deposit_count = WasteDeposit.query.filter_by(user_id=user_id, status='validated').count()
    total_weight = db.session.query(
        db.func.coalesce(db.func.sum(WasteDeposit.weight_kg), 0)
    ).filter(
        WasteDeposit.user_id == user_id,
        WasteDeposit.status == 'validated'
    ).scalar()

    earned_badge_ids = {
        ub.badge_id for ub in UserBadge.query.filter_by(user_id=user_id).all()
    }

    awarded_count = 0
    for badge in Badge.query.all():
        if badge.id in earned_badge_ids:
            continue

        earned = False
        if badge.condition_type == 'deposit_count':
            earned = deposit_count >= badge.condition_value
        elif badge.condition_type == 'total_weight':
            earned = total_weight >= badge.condition_value
        elif badge.condition_type == 'points':
            earned = user.total_points >= badge.condition_value

        if earned:
            db.session.add(UserBadge(user_id=user_id, badge_id=badge.id))
            awarded_count += 1

    return awarded_count




def seed_database():
    """Seed the database with initial data."""

    ensure_waste_point_rates_seeded()
    ensure_point_settings_seeded()

    # ─── Admin User ────────────────────────────────────────────
    admin = User.query.filter_by(email='admin@dlh.padang.go.id').first()
    if not admin:
        admin = User(
            name='Admin DLH Padang',
            email='admin@dlh.padang.go.id',
            account_number='ADM-000001',
            role='admin',
            status='approved',
            level='Admin',

            total_points=0,
        )
        admin.set_password('admin123')
        db.session.add(admin)
        print("✅ Admin user created: admin@dlh.padang.go.id / admin123")
    else:
        print("ℹ️  Admin user already exists")

    db.session.commit()
    print("\n🎉 Database seeding completed!")


def main():
    app = create_app()

    with app.app_context():
        print("📦 Creating database tables...")
        db.create_all()
        print("✅ Tables created successfully\n")

        print("🌱 Seeding database...")
        seed_database()


if __name__ == '__main__':
    main()
