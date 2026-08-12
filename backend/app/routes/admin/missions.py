from datetime import datetime, timezone

from flask import jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app import db
from app.models.mission import Mission
from app.models.participation_risk import ParticipationRisk
from app.models.waste_point_rate import WastePointRate
from app.routes.admin import admin_bp
from app.routes.admin_common import _get_current_user, _require_admin
from app.utils.api_response import error_response


@admin_bp.route('/missions', methods=['GET'])
@jwt_required()
def get_all_missions():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    missions = Mission.query.order_by(Mission.created_at.desc()).all()
    return jsonify({"missions": [m.to_dict() for m in missions]}), 200


@admin_bp.route('/missions', methods=['POST'])
@jwt_required()
def create_mission():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    data = request.get_json()
    if not data:
        return error_response("Request body tidak boleh kosong", "validation_error", status=400)

    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    target_type = data.get('target_type', '').strip()
    target_value = data.get('target_value')
    points_reward = data.get('points_reward')
    period = data.get('period', 'weekly').strip()
    waste_type_code = (data.get('waste_type_code') or '').strip().lower()
    target_label_raw = (data.get('target_label') or '').strip().lower()
    deadline_raw = data.get('deadline')

    if not title or not target_type or target_value is None or points_reward is None:
        return error_response(
            "title, target_type, target_value, dan points_reward wajib diisi",
            "validation_error",
            status=400,
            fields={
                "title": "required" if not title else None,
                "target_type": "required" if not target_type else None,
                "target_value": "required" if target_value is None else None,
                "points_reward": "required" if points_reward is None else None,
            },
        )

    if target_type not in ['deposit_count', 'weight']:
        return error_response(
            "target_type harus 'deposit_count' atau 'weight'",
            "validation_error",
            status=400,
            fields={"target_type": "invalid"},
        )

    if period not in ['daily', 'weekly']:
        return error_response("period harus 'daily' atau 'weekly'", "validation_error", status=400, fields={"period": "invalid"})

    valid_labels = ['churn', 'not_churn']
    target_label = target_label_raw if target_label_raw in valid_labels else None

    deadline = None
    if deadline_raw:
        try:
            deadline = datetime.fromisoformat(deadline_raw.replace('Z', '+00:00'))
        except ValueError:
            return error_response("Format batas waktu (deadline) tidak valid", "validation_error", status=400)

    rate = None
    if waste_type_code:
        rate = WastePointRate.query.filter(func.lower(WastePointRate.code) == waste_type_code).first()
        if not rate or not rate.is_active:
            return error_response(
                "Jenis sampah tidak valid atau belum aktif",
                "validation_error",
                status=400,
                fields={"waste_type_code": "invalid"},
            )

    mission = Mission(
        title=title,
        description=description,
        target_type=target_type,
        target_value=float(target_value),
        points_reward=int(points_reward),
        period=period,
        waste_type_code=rate.code if rate else None,
        target_label=target_label,
        deadline=deadline,
        is_active=True,
    )
    db.session.add(mission)
    db.session.commit()

    return jsonify({
        "message": "Misi berhasil dibuat",
        "mission": mission.to_dict(),
    }), 201


@admin_bp.route('/missions/<int:mission_id>', methods=['PUT'])
@jwt_required()
def update_mission(mission_id):
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    mission = Mission.query.get(mission_id)
    if not mission:
        return error_response("Misi tidak ditemukan", "not_found", status=404)

    data = request.get_json() or {}

    if 'title' in data:
        mission.title = data['title'].strip()
    if 'description' in data:
        mission.description = data['description'].strip()
    if 'target_type' in data:
        mission.target_type = data['target_type'].strip()
    if 'target_value' in data:
        mission.target_value = float(data['target_value'])
    if 'points_reward' in data:
        mission.points_reward = int(data['points_reward'])
    if 'period' in data:
        mission.period = data['period'].strip()
    if 'waste_type_code' in data:
        raw_code = (data.get('waste_type_code') or '').strip().lower()
        if raw_code:
            rate = WastePointRate.query.filter(func.lower(WastePointRate.code) == raw_code).first()
            if not rate or not rate.is_active:
                return error_response(
                    "Jenis sampah tidak valid atau belum aktif",
                    "validation_error",
                    status=400,
                    fields={"waste_type_code": "invalid"},
                )
            mission.waste_type_code = rate.code
        else:
            mission.waste_type_code = None
    if 'target_label' in data:
        raw_label = (data.get('target_label') or '').strip().lower()
        valid_labels = ['churn', 'not_churn']
        mission.target_label = raw_label if raw_label in valid_labels else None
    if 'deadline' in data:
        deadline_raw = data.get('deadline')
        if deadline_raw:
            try:
                mission.deadline = datetime.fromisoformat(deadline_raw.replace('Z', '+00:00'))
            except ValueError:
                return error_response("Format batas waktu (deadline) tidak valid", "validation_error", status=400)
        else:
            mission.deadline = None
    if 'is_active' in data:
        is_active_val = bool(data['is_active'])
        if is_active_val:
            check_deadline = mission.deadline
            if 'deadline' in data:
                deadline_raw = data.get('deadline')
                if deadline_raw:
                    try:
                        check_deadline = datetime.fromisoformat(deadline_raw.replace('Z', '+00:00'))
                    except ValueError:
                        pass
            if check_deadline and check_deadline < datetime.now(timezone.utc):
                return error_response(
                    "Tidak dapat mengaktifkan misi yang telah melewati batas waktu tanpa memperbarui batas waktu.",
                    "validation_error",
                    status=400,
                    fields={"is_active": "expired"}
                )
        mission.is_active = is_active_val

    db.session.commit()

    return jsonify({
        "message": "Misi berhasil diupdate",
        "mission": mission.to_dict(),
    }), 200


@admin_bp.route('/missions/<int:mission_id>', methods=['DELETE'])
@jwt_required()
def delete_mission(mission_id):
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    mission = Mission.query.get(mission_id)
    if not mission:
        return error_response("Misi tidak ditemukan", "not_found", status=404)

    mission.is_active = False
    db.session.commit()

    return jsonify({
        "message": "Misi berhasil dinonaktifkan",
        "mission": mission.to_dict(),
    }), 200


@admin_bp.route('/churn-trend', methods=['GET'])
@jwt_required()
def churn_trend():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    months = request.args.get('months', 6, type=int)
    now = datetime.now(timezone.utc)

    results = []
    for i in range(months - 1, -1, -1):
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i > 0:
            month_val = month_start.month - i
            year_val = month_start.year
            while month_val <= 0:
                month_val += 12
                year_val -= 1
            month_start = month_start.replace(year=year_val, month=month_val)

        churn_counts = db.session.query(
            ParticipationRisk.will_churn,
            func.count(ParticipationRisk.id),
        ).group_by(ParticipationRisk.will_churn).all()

        dist = {'churn': 0, 'not_churn': 0}
        for will_churn, count in churn_counts:
            key = 'churn' if will_churn else 'not_churn'
            dist[key] = int(count)

        results.append({
            'month': month_start.strftime('%Y-%m'),
            'churn': dist['churn'],
            'not_churn': dist['not_churn'],
        })

    return jsonify({"success": True, "data": results}), 200

