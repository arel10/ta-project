from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from app import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    account_number = db.Column(db.String(20), unique=True, nullable=True, index=True)
    gender = db.Column(db.String(20), nullable=True)
    nik = db.Column(db.String(32), nullable=True, index=True)
    address = db.Column(db.String(255), nullable=True)
    department = db.Column(db.String(120), nullable=True)
    role = db.Column(db.String(10), nullable=False, default='member')  # member / admin
    level = db.Column(db.String(30), nullable=False, default='Pemula')
    total_points = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.Index('ix_users_role_created_at', 'role', 'created_at'),
        db.Index('ix_users_role_total_points', 'role', 'total_points'),
        db.Index('ix_users_role_name', 'role', 'name'),
    )

    # Relationships
    deposits = db.relationship('WasteDeposit', backref='user', lazy='dynamic',
                               foreign_keys='WasteDeposit.user_id')
    user_missions = db.relationship('UserMission', backref='user', lazy='dynamic')
    user_badges = db.relationship('UserBadge', backref='user', lazy='dynamic')
    redemptions = db.relationship('RewardRedemption', backref='user', lazy='dynamic')
    risk_profile = db.relationship('ParticipationRisk', backref='user', uselist=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def is_admin(self):
        return self.role == 'admin'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'account_number': self.account_number,
            'gender': self.gender,
            'nik': self.nik,
            'address': self.address,
            'department': self.department,
            'role': self.role,
            'level': self.level,
            'total_points': self.total_points,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'risk_level': self.risk_profile.risk_level if self.risk_profile else 'low',
        }

    def __repr__(self):
        return f'<User {self.email}>'
