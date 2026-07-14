import os
import uuid

from flask import current_app, jsonify, request, send_from_directory, url_for
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from werkzeug.utils import secure_filename

from app import db
from app.models.badge import Badge, UserBadge
from app.models.reward import Reward, RewardRedemption
from app.routes.admin import admin_bp
from app.routes.admin_common import (
    _get_current_user,
    _get_reward_upload_dir,
    _is_allowed_image,
    _remove_local_reward_image,
    _require_admin,
    _to_absolute_reward_image_url,
)
from app.services.gamification_service import sync_all_users_levels_and_badges
from app.services.simple_cache import invalidate_cache
from app.utils.api_response import error_response


@admin_bp.route('/reward-images', methods=['POST'])
@jwt_required()
def upload_reward_image():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    if 'image' not in request.files:
        return error_response("File image wajib diisi", "validation_error", status=400, fields={"image": "required"})

    image = request.files['image']
    if not image or not image.filename:
        return error_response("File image tidak valid", "validation_error", status=400, fields={"image": "invalid"})

    max_size = int(current_app.config.get('MAX_REWARD_IMAGE_SIZE', 5 * 1024 * 1024))
    image.stream.seek(0, os.SEEK_END)
    image_size = image.stream.tell()
    image.stream.seek(0)
    if image_size > max_size:
        return error_response("Ukuran file melebihi batas maksimal 5MB", "payload_too_large", status=413)

    filename = secure_filename(image.filename)
    mime_type = (image.mimetype or '').lower()
    if not _is_allowed_image(filename, mime_type):
        return error_response(
            "Format file tidak didukung. Gunakan PNG, JPG, atau WEBP",
            "validation_error",
            status=400,
            fields={"image": "invalid_format"},
        )

    ext = filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{ext}"

    upload_dir = _get_reward_upload_dir()
    os.makedirs(upload_dir, exist_ok=True)

    image.save(os.path.join(upload_dir, unique_filename))
    image_url = url_for('admin.get_reward_image', filename=unique_filename)

    return jsonify({
        "message": "Gambar reward berhasil diupload",
        "image_url": image_url,
    }), 201


@admin_bp.route('/reward-images/<path:filename>', methods=['GET'])
def get_reward_image(filename):
    return send_from_directory(_get_reward_upload_dir(), filename)


@admin_bp.route('/rewards', methods=['GET'])
@jwt_required()
def get_all_rewards():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    rewards = Reward.query.order_by(Reward.created_at.desc()).all()
    payload = []
    for reward in rewards:
        item = reward.to_dict()
        item['image_url'] = _to_absolute_reward_image_url(item.get('image_url'))
        payload.append(item)

    return jsonify({"rewards": payload}), 200


@admin_bp.route('/rewards', methods=['POST'])
@jwt_required()
def create_reward():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    data = request.get_json()
    if not data:
        return error_response("Request body tidak boleh kosong", "validation_error", status=400)

    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    points_cost = data.get('points_cost')
    stock = data.get('stock', 0)
    image_url = data.get('image_url', '').strip()

    if not name or points_cost is None:
        return error_response(
            "name dan points_cost wajib diisi",
            "validation_error",
            status=400,
            fields={
                "name": "required" if not name else None,
                "points_cost": "required" if points_cost is None else None,
            },
        )

    reward = Reward(
        name=name,
        description=description,
        points_cost=int(points_cost),
        stock=int(stock),
        image_url=image_url if image_url else None,
        is_active=True,
    )
    db.session.add(reward)
    db.session.commit()

    invalidate_cache('rewards_active')

    response_reward = reward.to_dict()
    response_reward['image_url'] = _to_absolute_reward_image_url(response_reward.get('image_url'))

    return jsonify({
        "message": "Reward berhasil dibuat",
        "reward": response_reward,
    }), 201


@admin_bp.route('/rewards/<int:reward_id>', methods=['PUT'])
@jwt_required()
def update_reward(reward_id):
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    reward = Reward.query.get(reward_id)
    if not reward:
        return error_response("Reward tidak ditemukan", "not_found", status=404)

    data = request.get_json() or {}
    old_image_url = reward.image_url

    if 'name' in data:
        reward.name = data['name'].strip()
    if 'description' in data:
        reward.description = data['description'].strip()
    if 'points_cost' in data:
        reward.points_cost = int(data['points_cost'])
    if 'stock' in data:
        reward.stock = int(data['stock'])
    if 'image_url' in data:
        new_image_url = (data['image_url'] or '').strip() or None
        if old_image_url and old_image_url != new_image_url:
            _remove_local_reward_image(old_image_url)
        reward.image_url = new_image_url
    if 'is_active' in data:
        reward.is_active = bool(data['is_active'])

    db.session.commit()

    invalidate_cache('rewards_active')

    response_reward = reward.to_dict()
    response_reward['image_url'] = _to_absolute_reward_image_url(response_reward.get('image_url'))

    return jsonify({
        "message": "Reward berhasil diupdate",
        "reward": response_reward,
    }), 200


@admin_bp.route('/badges', methods=['GET'])
@jwt_required()
def get_all_badges():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    badges = Badge.query.all()
    return jsonify({"badges": [b.to_dict() for b in badges]}), 200


@admin_bp.route('/badges', methods=['POST'])
@jwt_required()
def create_badge():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    data = request.get_json()
    if not data:
        return error_response("Request body tidak boleh kosong", "validation_error", status=400)

    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    icon_url = data.get('icon_url', '').strip()
    condition_type = data.get('condition_type', '').strip()
    condition_value = data.get('condition_value')

    if not name or not condition_type or condition_value is None:
        return error_response(
            "name, condition_type, dan condition_value wajib diisi",
            "validation_error",
            status=400,
            fields={
                "name": "required" if not name else None,
                "condition_type": "required" if not condition_type else None,
                "condition_value": "required" if condition_value is None else None,
            },
        )

    badge = Badge(
        name=name,
        description=description,
        icon_url=icon_url if icon_url else None,
        condition_type=condition_type,
        condition_value=float(condition_value),
    )
    db.session.add(badge)
    db.session.commit()

    sync_stats = sync_all_users_levels_and_badges()

    return jsonify({
        "message": "Badge berhasil dibuat",
        "badge": badge.to_dict(),
        "sync": sync_stats,
    }), 201


@admin_bp.route('/rewards/<int:reward_id>/stock', methods=['PATCH'])
@jwt_required()
def update_reward_stock(reward_id):
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    reward = Reward.query.get(reward_id)
    if not reward:
        return error_response("Reward tidak ditemukan", "not_found", status=404)

    data = request.get_json() or {}
    add_stock = data.get('add_stock', 0)

    if not isinstance(add_stock, int) or add_stock <= 0:
        return error_response(
            "add_stock harus bilangan bulat positif",
            "validation_error",
            status=400,
            fields={"add_stock": "invalid"},
        )

    reward.stock += add_stock
    db.session.commit()

    invalidate_cache('rewards_active')

    return jsonify({
        "message": f"Stok berhasil ditambahkan +{add_stock}",
        "reward": reward.to_dict(),
    }), 200


@admin_bp.route('/redemptions/summary', methods=['GET'])
@jwt_required()
def redemptions_summary():
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    pending_count = RewardRedemption.query.filter_by(status='pending').count()
    total_points_held = db.session.query(
        func.coalesce(func.sum(RewardRedemption.points_spent), 0)
    ).filter(RewardRedemption.status == 'pending').scalar()

    affected_rewards = RewardRedemption.query.filter_by(
        status='pending'
    ).with_entities(RewardRedemption.reward_id).distinct().count()

    return jsonify({
        "pending_count": int(pending_count),
        "total_points_held": int(total_points_held or 0),
        "affected_rewards_count": int(affected_rewards),
    }), 200
