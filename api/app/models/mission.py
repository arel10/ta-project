from datetime import datetime, timezone
from app import db


class Mission(db.Model):
    __tablename__ = 'missions'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    target_type = db.Column(db.String(30), nullable=False)  # deposit_count / weight
    target_value = db.Column(db.Float, nullable=False)
    points_reward = db.Column(db.Integer, nullable=False, default=0)
    period = db.Column(db.String(20), nullable=False, default='weekly')  # daily / weekly
    waste_type_code = db.Column(db.String(10), db.ForeignKey('waste_point_rates.code'), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    target_label = db.Column(db.String(20), nullable=True, default=None)  # null=all, 'high', 'medium', 'low'
    deadline = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user_missions = db.relationship('UserMission', backref='mission', lazy='dynamic')

    @classmethod
    def get_active_query(cls):
        now = datetime.now(timezone.utc)
        return cls.query.filter(
            cls.is_active == True,
            (cls.deadline == None) | (cls.deadline > now)
        )

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'target_type': self.target_type,
            'target_value': self.target_value,
            'points_reward': self.points_reward,
            'period': self.period,
            'waste_type_code': self.waste_type_code,
            'is_active': self.is_active,
            'target_label': self.target_label,  # null=semua, 'high'/'medium'/'low'
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<Mission {self.title}>'


class UserMission(db.Model):
    __tablename__ = 'user_missions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    mission_id = db.Column(db.Integer, db.ForeignKey('missions.id'), nullable=False, index=True)
    progress = db.Column(db.Float, nullable=False, default=0)
    is_completed = db.Column(db.Boolean, nullable=False, default=False)
    completed_at = db.Column(db.DateTime, nullable=True)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'mission_id', name='uq_user_mission'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'mission_id': self.mission_id,
            'progress': self.progress,
            'is_completed': self.is_completed,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'mission': self.mission.to_dict() if self.mission else None,
        }

    def __repr__(self):
        return f'<UserMission user={self.user_id} mission={self.mission_id}>'
