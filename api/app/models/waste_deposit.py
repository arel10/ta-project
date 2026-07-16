from datetime import datetime, timezone
from app import db


class WasteDeposit(db.Model):
    __tablename__ = 'waste_deposits'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    weight_kg = db.Column(db.Float, nullable=False)
    waste_type = db.Column(db.String(50), nullable=False)  # plastik, kertas, logam, kaca, organik, elektronik
    activity_type = db.Column(db.String(100), nullable=True)
    source_waste_label = db.Column(db.String(120), nullable=True)
    source_price_per_kg = db.Column(db.Integer, nullable=True)
    source_total_savings = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending / validated / rejected
    points_earned = db.Column(db.Integer, nullable=False, default=0)
    rejection_reason = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    validated_at = db.Column(db.DateTime, nullable=True)
    validated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Relationship for the admin who validated
    validator = db.relationship('User', foreign_keys=[validated_by], backref='validated_deposits')

    __table_args__ = (
        db.Index('ix_waste_deposits_status', 'status'),
        db.Index('ix_waste_deposits_created_at', 'created_at'),
        db.Index('ix_waste_deposits_user_status', 'user_id', 'status'),
        db.Index('ix_waste_deposits_status_created_at', 'status', 'created_at'),
        db.Index('ix_waste_deposits_user_created_at', 'user_id', 'created_at'),
        db.Index('ix_waste_deposits_status_waste_created', 'status', 'waste_type', 'created_at'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'weight_kg': self.weight_kg,
            'waste_type': self.waste_type,
            'activity_type': self.activity_type,
            'source_waste_label': self.source_waste_label,
            'source_price_per_kg': self.source_price_per_kg,
            'source_total_savings': self.source_total_savings,
            'status': self.status,
            'points_earned': self.points_earned,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'validated_at': self.validated_at.isoformat() if self.validated_at else None,
            'validated_by': self.validated_by,
        }

    def __repr__(self):
        return f'<WasteDeposit {self.id} - {self.waste_type} {self.weight_kg}kg>'
