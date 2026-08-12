from datetime import datetime, timezone
from app import db


DEFAULT_POINT_SETTINGS = [
    {"key": "bronze_threshold", "name": "Bronze", "value": 0, "sort_order": 1},
    {"key": "silver_threshold", "name": "Silver", "value": 5000, "sort_order": 2},
    {"key": "gold_threshold", "name": "Gold", "value": 10000, "sort_order": 3},
    {"key": "platinum_threshold", "name": "Platinum", "value": 15000, "sort_order": 4},
]


class PointSetting(db.Model):
    __tablename__ = 'point_settings'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), nullable=False, unique=True, index=True)
    name = db.Column(db.String(64), nullable=False)
    value = db.Column(db.Integer, nullable=False)
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        db.Index('ix_point_settings_sort_order', 'sort_order'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'key': self.key,
            'name': self.name,
            'value': self.value,
            'sort_order': self.sort_order,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<PointSetting {self.key}={self.value}>'
