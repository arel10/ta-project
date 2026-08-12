from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from app import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    account_number = db.Column(db.String(64), unique=True, nullable=True, index=True)
    gender = db.Column(db.Enum('Laki-Laki', 'Perempuan', name='gender_enum'), nullable=True)
    nik = db.Column(db.String(32), nullable=True, index=True)
    ktp_image_url = db.Column(db.String(255), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    department = db.Column(db.String(120), nullable=True)
    role = db.Column(db.Enum('member', 'admin', name='role_enum'), nullable=False, default='member')
    status = db.Column(db.Enum('pending', 'approved', 'rejected', name='user_status_enum'), nullable=False, default='pending')
    level = db.Column(db.String(16), nullable=False, default='Pemula')
    total_points = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.Index('ix_users_role_created_at', 'role', 'created_at'),
        db.Index('ix_users_role_total_points', 'role', 'total_points'),
        db.Index('ix_users_role_name', 'role', 'name'),
        db.Index('ix_users_status', 'status'),
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

    @property
    def is_approved(self):
        return self.status == 'approved'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'account_number': self.account_number,
            'gender': self.gender,
            'nik': self.nik,
            'ktp_image_url': self.ktp_image_url,
            'address': self.address,
            'department': self.department,
            'role': self.role,
            'status': self.status,
            'level': self.level,
            'total_points': self.total_points,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'will_churn': self.risk_profile.will_churn if self.risk_profile else False,
            'churn_probability': self.risk_profile.churn_probability if self.risk_profile else None,
        }

    def __repr__(self):
        return f'<User {self.email}>'
