from datetime import datetime, timezone
from app import db


class ParticipationRisk(db.Model):
    __tablename__ = 'participation_risk'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True, index=True)
    recency_days = db.Column(db.Integer, nullable=True)
    frequency = db.Column(db.Integer, nullable=True)
    consistency_score = db.Column(db.Float, nullable=True)
    avg_interval = db.Column(db.Float, nullable=True)
    std_interval = db.Column(db.Float, nullable=True)
    avg_berat = db.Column(db.Float, nullable=True)
    trend_berat = db.Column(db.Float, nullable=True)
    days_active = db.Column(db.Integer, nullable=True)
    churn_probability = db.Column(db.Float, nullable=True)  # 0.0 – 1.0
    will_churn = db.Column(db.Boolean, nullable=True)       # True = churn, False = tidak
    confidence_score = db.Column(db.Float, nullable=True)
    predicted_at = db.Column(db.DateTime, nullable=True, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.Index('ix_participation_risk_will_churn', 'will_churn'),
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
            'avg_interval': self.avg_interval,
            'std_interval': self.std_interval,
            'avg_berat': self.avg_berat,
            'trend_berat': self.trend_berat,
            'days_active': self.days_active,
            'churn_probability': self.churn_probability,
            'will_churn': self.will_churn,
            'confidence_score': self.confidence_score,
            'predicted_at': self.predicted_at.isoformat() if self.predicted_at else None,
        }

    def __repr__(self):
        return f'<ParticipationRisk user={self.user_id} churn={self.will_churn}>'
