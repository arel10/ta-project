from datetime import datetime, timezone
from app import db


class Badge(db.Model):
    __tablename__ = 'badges'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    icon_url = db.Column(db.String(255), nullable=True)
    condition_type = db.Column(db.String(30), nullable=False)  # deposit_count / total_weight / points
    condition_value = db.Column(db.Float, nullable=False)

    # Relationships
    user_badges = db.relationship('UserBadge', backref='badge', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon_url': self.icon_url,
            'condition_type': self.condition_type,
            'condition_value': self.condition_value,
        }

    def __repr__(self):
        return f'<Badge {self.name}>'


class UserBadge(db.Model):
    __tablename__ = 'user_badges'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    badge_id = db.Column(db.Integer, db.ForeignKey('badges.id'), nullable=False, index=True)
    earned_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint('user_id', 'badge_id', name='uq_user_badge'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'badge_id': self.badge_id,
            'earned_at': self.earned_at.isoformat() if self.earned_at else None,
            'badge': self.badge.to_dict() if self.badge else None,
        }

    def __repr__(self):
        return f'<UserBadge user={self.user_id} badge={self.badge_id}>'
