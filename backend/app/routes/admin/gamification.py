from flask import jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app import db
from app.models.badge import Badge
from app.models.point_setting import PointSetting
from app.models.waste_point_rate import WastePointRate
from app.routes.admin import admin_bp
from app.routes.admin_common import _get_current_user, _require_admin
from app.services.gamification_service import (
    ensure_point_settings_seeded,
    ensure_waste_point_rates_seeded,
    sync_all_users_levels_and_badges,
)
from app.services.simple_cache import invalidate_cache
from app.utils.api_response import error_response


@admin_bp.route('/waste-point-rates', methods=['GET'])
@jwt_required()
def get_waste_point_rates():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    ensure_waste_point_rates_seeded()
    rates = WastePointRate.query.order_by(WastePointRate.sort_order.asc(), WastePointRate.code.asc()).all()
    return jsonify({"rates": [r.to_dict() for r in rates]}), 200


@admin_bp.route('/waste-point-rates', methods=['POST'])
@jwt_required()
def create_waste_point_rate():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    payload = request.get_json() or {}
    code = (payload.get('code') or '').strip().upper()
    name = (payload.get('name') or '').strip()
    category = (payload.get('category') or '').strip().lower() or 'lainnya'
    points = payload.get('points_per_kg')
    is_active = payload.get('is_active', True)

    if not code or not name or points is None:
        return error_response(
            "code, name, dan points_per_kg wajib diisi",
            "validation_error",
            status=400,
            fields={
                "code": "required" if not code else None,
                "name": "required" if not name else None,
                "points_per_kg": "required" if points is None else None,
            },
        )

    if len(code) > 10:
        return error_response("code maksimal 10 karakter", "validation_error", status=400, fields={"code": "max_length_10"})

    existing = WastePointRate.query.filter_by(code=code).first()
    if existing:
        return error_response("Code sampah sudah digunakan", "validation_error", status=400, fields={"code": "duplicate"})

    try:
        points_value = int(points)
    except (ValueError, TypeError):
        return error_response("points_per_kg harus angka", "validation_error", status=400, fields={"points_per_kg": "invalid"})

    if points_value < 0:
        return error_response("points_per_kg tidak boleh negatif", "validation_error", status=400, fields={"points_per_kg": "min_0"})

    max_sort = db.session.query(func.coalesce(func.max(WastePointRate.sort_order), 0)).scalar() or 0
    rate = WastePointRate(
        code=code,
        name=name,
        category=category,
        points_per_kg=points_value,
        is_active=bool(is_active),
        sort_order=int(max_sort) + 1,
    )

    db.session.add(rate)
    db.session.commit()

    invalidate_cache('waste_point_rates_active')

    return jsonify({
        "message": "Jenis sampah berhasil ditambahkan",
        "rate": rate.to_dict(),
    }), 201


@admin_bp.route('/waste-point-rates', methods=['PUT'])
@jwt_required()
def update_waste_point_rates():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    payload = request.get_json() or {}
    items = payload.get('rates')
    if not isinstance(items, list) or not items:
        return error_response("rates wajib berupa list dan tidak boleh kosong", "validation_error", status=400, fields={"rates": "invalid"})

    ensure_waste_point_rates_seeded()

    for item in items:
        rate_id = item.get('id')
        code = (item.get('code') or '').strip().upper()
        name = (item.get('name') or '').strip()
        category = (item.get('category') or '').strip().lower()
        points = item.get('points_per_kg')
        is_active = item.get('is_active')

        if not rate_id or not code:
            return error_response(
                "id dan code wajib diisi",
                "validation_error",
                status=400,
                fields={
                    "id": "required" if not rate_id else None,
                    "code": "required" if not code else None,
                },
            )

        rate = WastePointRate.query.get(rate_id)
        if not rate:
            return error_response(f"Rate dengan id {rate_id} tidak ditemukan", "not_found", status=404)

        if points is None:
            return error_response(
                f"points_per_kg untuk {code} wajib diisi",
                "validation_error",
                status=400,
                fields={"points_per_kg": "required"},
            )

        if not name:
            return error_response(
                f"name untuk {code} wajib diisi",
                "validation_error",
                status=400,
                fields={"name": "required"},
            )

        try:
            points_value = int(points)
        except (ValueError, TypeError):
            return error_response(
                f"points_per_kg untuk {code} harus angka",
                "validation_error",
                status=400,
                fields={"points_per_kg": "invalid"},
            )

        if points_value < 0:
            return error_response(
                f"points_per_kg untuk {code} tidak boleh negatif",
                "validation_error",
                status=400,
                fields={"points_per_kg": "min_0"},
            )

        rate.points_per_kg = points_value
        rate.name = name
        if category:
            rate.category = category
        if isinstance(is_active, bool):
            rate.is_active = is_active

    db.session.commit()
    invalidate_cache('waste_point_rates_active')

    rates = WastePointRate.query.order_by(WastePointRate.sort_order.asc(), WastePointRate.code.asc()).all()
    return jsonify({
        "message": "Pengaturan poin sampah berhasil disimpan",
        "rates": [r.to_dict() for r in rates],
    }), 200


@admin_bp.route('/point-settings', methods=['GET'])
@jwt_required()
def get_point_settings():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    ensure_point_settings_seeded()
    settings = PointSetting.query.order_by(PointSetting.sort_order.asc()).all()
    return jsonify({"settings": [s.to_dict() for s in settings]}), 200


@admin_bp.route('/point-settings', methods=['PUT'])
@jwt_required()
def update_point_settings():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    payload = request.get_json() or {}
    items = payload.get('settings')
    if not isinstance(items, list) or not items:
        return error_response("settings wajib berupa list dan tidak boleh kosong", "validation_error", status=400, fields={"settings": "invalid"})

    ensure_point_settings_seeded()

    for item in items:
        setting_id = item.get('id')
        key = (item.get('key') or '').strip()
        name = (item.get('name') or '').strip()
        value = item.get('value')
        sort_order = item.get('sort_order')

        if not setting_id or not key:
            return error_response(
                "id dan key wajib diisi",
                "validation_error",
                status=400,
                fields={
                    "id": "required" if not setting_id else None,
                    "key": "required" if not key else None,
                },
            )

        setting = PointSetting.query.get(setting_id)
        if not setting:
            return error_response(f"Pengaturan poin dengan id {setting_id} tidak ditemukan", "not_found", status=404)

        if value is None:
            return error_response(
                f"value untuk {key} wajib diisi",
                "validation_error",
                status=400,
                fields={"value": "required"},
            )

        try:
            value_int = int(value)
        except (ValueError, TypeError):
            return error_response(
                f"value untuk {key} harus angka",
                "validation_error",
                status=400,
                fields={"value": "invalid"},
            )

        if value_int < 0:
            return error_response(
                f"value untuk {key} tidak boleh negatif",
                "validation_error",
                status=400,
                fields={"value": "min_0"},
            )

        if name:
            setting.name = name
        setting.value = value_int

        if sort_order is not None:
            try:
                setting.sort_order = int(sort_order)
            except (ValueError, TypeError):
                return error_response(
                    f"sort_order untuk {key} harus angka",
                    "validation_error",
                    status=400,
                    fields={"sort_order": "invalid"},
                )

    latest = PointSetting.query.order_by(PointSetting.sort_order.asc()).all()
    threshold_values = [int(s.value) for s in latest]
    if threshold_values != sorted(threshold_values) or len(set(threshold_values)) != len(threshold_values):
        db.session.rollback()
        return error_response(
            "Nilai threshold level harus berurutan naik dan tidak boleh sama",
            "validation_error",
            status=400,
        )

    db.session.commit()

    invalidate_cache('point_settings')

    sync_stats = sync_all_users_levels_and_badges()
    level_badges = Badge.query.filter(Badge.name.like('Badge Level %')).order_by(Badge.condition_value.asc()).all()
    settings = PointSetting.query.order_by(PointSetting.sort_order.asc()).all()
    return jsonify({
        "message": "Pengaturan level poin berhasil disimpan",
        "settings": [s.to_dict() for s in settings],
        "level_badges": [b.to_dict() for b in level_badges],
        "sync": sync_stats,
    }), 200


@admin_bp.route('/sync-gamification', methods=['POST'])
@jwt_required()
def sync_gamification():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    sync_stats = sync_all_users_levels_and_badges()
    level_badges = Badge.query.filter(Badge.name.like('Badge Level %')).order_by(Badge.condition_value.asc()).all()

    return jsonify({
        "message": "Sinkronisasi level dan badge berhasil dijalankan",
        "level_badges": [b.to_dict() for b in level_badges],
        "sync": sync_stats,
    }), 200
