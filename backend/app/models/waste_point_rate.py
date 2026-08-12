from datetime import datetime, timezone
from app import db


DEFAULT_WASTE_POINT_RATES = [
    {"code": "P1", "name": "Gelas Air Mineral Bersih", "points_per_kg": 4000, "category": "plastik", "sort_order": 1},
    {"code": "P2", "name": "Gelas Air", "points_per_kg": 2000, "category": "plastik", "sort_order": 2},
    {"code": "P3", "name": "600mL & 1 L Bersih", "points_per_kg": 4200, "category": "plastik", "sort_order": 3},
    {"code": "P4", "name": "600mL & 1 L Kotor", "points_per_kg": 1900, "category": "plastik", "sort_order": 4},
    {"code": "P5", "name": "Pet Berwarna", "points_per_kg": 800, "category": "plastik", "sort_order": 5},
    {"code": "P6", "name": "Monte", "points_per_kg": 1800, "category": "plastik", "sort_order": 6},
    {"code": "P7", "name": "Botol", "points_per_kg": 2500, "category": "plastik", "sort_order": 7},
    {"code": "P8", "name": "Ember/Karah", "points_per_kg": 1800, "category": "plastik", "sort_order": 8},
    {"code": "P9", "name": "Mix", "points_per_kg": 1200, "category": "plastik", "sort_order": 9},
    {"code": "K1", "name": "Kardus", "points_per_kg": 1300, "category": "kertas", "sort_order": 10},
    {"code": "K2", "name": "HVS Berlem", "points_per_kg": 1600, "category": "kertas", "sort_order": 11},
    {"code": "K3", "name": "HVS Tidak Berlem", "points_per_kg": 2000, "category": "kertas", "sort_order": 12},
    {"code": "K4", "name": "Koran", "points_per_kg": 800, "category": "kertas", "sort_order": 13},
    {"code": "K5", "name": "Mix", "points_per_kg": 400, "category": "kertas", "sort_order": 14},
    {"code": "K6", "name": "Karton Telur", "points_per_kg": 100, "category": "kertas", "sort_order": 15},
    {"code": "B1", "name": "Kaleng Keras", "points_per_kg": 1600, "category": "logam", "sort_order": 16},
    {"code": "B2", "name": "Besi Kropos", "points_per_kg": 2400, "category": "logam", "sort_order": 17},
    {"code": "B3", "name": "Seng", "points_per_kg": 800, "category": "logam", "sort_order": 18},
    {"code": "L1", "name": "Kaleng Lunak", "points_per_kg": 9600, "category": "logam", "sort_order": 19},
    {"code": "MJ", "name": "Minyak Jelantah", "points_per_kg": 5000, "category": "minyak", "sort_order": 20},
]


class WastePointRate(db.Model):
    __tablename__ = 'waste_point_rates'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(10), nullable=False, unique=True, index=True)
    name = db.Column(db.String(64), nullable=False)
    category = db.Column(db.String(30), nullable=False, default='lainnya')
    points_per_kg = db.Column(db.Integer, nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.Index('ix_waste_point_rates_active_sort', 'is_active', 'sort_order'),
        db.Index('ix_waste_point_rates_category', 'category'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'category': self.category,
            'points_per_kg': self.points_per_kg,
            'is_active': self.is_active,
            'sort_order': self.sort_order,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<WastePointRate {self.code} {self.points_per_kg}>'
