import uuid
from datetime import datetime, timezone
from app import db


class Reward(db.Model):
    __tablename__ = 'rewards'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    points_cost = db.Column(db.Integer, nullable=False)
    stock = db.Column(db.Integer, nullable=False, default=0)
    image_url = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.Index('ix_rewards_is_active_points_cost', 'is_active', 'points_cost'),
        db.Index('ix_rewards_created_at', 'created_at'),
    )

    # Relationships
    redemptions = db.relationship('RewardRedemption', backref='reward', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'points_cost': self.points_cost,
            'stock': self.stock,
            'image_url': self.image_url,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<Reward {self.name}>'


class RewardRedemption(db.Model):
    __tablename__ = 'reward_redemptions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    reward_id = db.Column(db.Integer, db.ForeignKey('rewards.id'), nullable=False, index=True)
    points_spent = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending / approved / rejected
    rejection_reason = db.Column(db.String(255), nullable=True)
    redemption_code = db.Column(db.String(50), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.Index('ix_reward_redemptions_status', 'status'),
        db.Index('ix_reward_redemptions_status_created_at', 'status', 'created_at'),
        db.Index('ix_reward_redemptions_user_created_at', 'user_id', 'created_at'),
    )

    @staticmethod
    def generate_code():
        """Generate a unique redemption code."""
        return f"SRK-{uuid.uuid4().hex[:8].upper()}"

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'reward_id': self.reward_id,
            'points_spent': self.points_spent,
            'status': self.status,
            'rejection_reason': self.rejection_reason,
            'redemption_code': self.redemption_code,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'reward': self.reward.to_dict() if self.reward else None,
        }

    def __repr__(self):
        return f'<RewardRedemption {self.redemption_code}>'
