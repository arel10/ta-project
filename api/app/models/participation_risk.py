from datetime import datetime, timezone
from app import db


class ParticipationRisk(db.Model):
    __tablename__ = 'participation_risk'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True, index=True)
    recency_days = db.Column(db.Integer, nullable=True)
    frequency = db.Column(db.Integer, nullable=True)
    consistency_score = db.Column(db.Float, nullable=True)
    risk_level = db.Column(db.String(10), nullable=True)  # low / medium / high
    confidence_score = db.Column(db.Float, nullable=True)
    predicted_at = db.Column(db.DateTime, nullable=True, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.Index('ix_participation_risk_risk_level', 'risk_level'),
        db.Index('ix_participation_risk_predicted_at', 'predicted_at'),
    )

    def to_dict(self):
        safe_recency = None
        if self.recency_days is not None:
            safe_recency = max(0, self.recency_days)

        return {
            'id': self.id,
            'user_id': self.user_id,
            'recency_days': safe_recency,
            'frequency': self.frequency,
            'consistency_score': self.consistency_score,
            'risk_level': self.risk_level,
            'confidence_score': self.confidence_score,
            'predicted_at': self.predicted_at.isoformat() if self.predicted_at else None,
        }

    def __repr__(self):
        return f'<ParticipationRisk user={self.user_id} risk={self.risk_level}>'
