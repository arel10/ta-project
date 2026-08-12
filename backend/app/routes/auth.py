import os
import random
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from werkzeug.utils import secure_filename
from app import db
from app.models.user import User
from app.utils.api_response import error_response

auth_bp = Blueprint('auth', __name__)

ALLOWED_KTP_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
ALLOWED_KTP_MIME_TYPES = {'image/png', 'image/jpeg', 'image/webp'}


def _get_ktp_upload_dir():
    upload_root = current_app.config.get('UPLOAD_FOLDER', os.path.join(os.getcwd(), 'uploads'))
    return os.path.join(upload_root, 'ktp')


def _save_ktp_image(file):
    """Save KTP image file and return its URL path."""
    if not file or not file.filename:
        return None

    filename = secure_filename(file.filename)
    if '.' not in filename:
        return None

    ext = filename.rsplit('.', 1)[1].lower()
    if ext not in ALLOWED_KTP_EXTENSIONS:
        return None

    mime = file.content_type or ''
    if mime not in ALLOWED_KTP_MIME_TYPES:
        return None

    upload_dir = _get_ktp_upload_dir()
    os.makedirs(upload_dir, exist_ok=True)

    unique_name = f"ktp_{uuid.uuid4().hex[:12]}.{ext}"
    filepath = os.path.join(upload_dir, unique_name)
    file.save(filepath)

    return f"/api/uploads/ktp/{unique_name}"


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new member account. Support both JSON and multipart/form-data"""
    if request.files or request.form:
        data = request.form.to_dict()
        ktp_file = request.files.get('ktp_image')
    else:
        data = request.get_json() or {}
        ktp_file = None

    if not data:
        return error_response("Request body tidak boleh kosong", "validation_error", status=400)

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')
    nik = data.get('nik', '').strip() or None
    gender = data.get('gender', '').strip() or None
    address = data.get('address', '').strip() or None

    if not name or not email or not password:
        return error_response(
            "Nama, email, dan password wajib diisi",
            "validation_error",
            status=400,
            fields={
                "name": "required" if not name else None,
                "email": "required" if not email else None,
                "password": "required" if not password else None,
            },
        )

    if len(password) < 6:
        return error_response(
            "Password minimal 6 karakter",
            "validation_error",
            status=400,
            fields={"password": "min_length_6"},
        )

    existing_email_user = User.query.filter_by(email=email).first()
    if existing_email_user:
        if existing_email_user.status == 'rejected':
            from app.models.badge import UserBadge
            from app.models.mission import UserMission
            from app.models.participation_risk import ParticipationRisk
            from app.models.reward import RewardRedemption
            from app.models.waste_deposit import WasteDeposit

            UserBadge.query.filter_by(user_id=existing_email_user.id).delete(synchronize_session=False)
            UserMission.query.filter_by(user_id=existing_email_user.id).delete(synchronize_session=False)
            ParticipationRisk.query.filter_by(user_id=existing_email_user.id).delete(synchronize_session=False)
            RewardRedemption.query.filter_by(user_id=existing_email_user.id).delete(synchronize_session=False)
            WasteDeposit.query.filter_by(user_id=existing_email_user.id).delete(synchronize_session=False)
            db.session.delete(existing_email_user)
            db.session.commit()
        else:
            return error_response("Email sudah terdaftar", "conflict", status=409, fields={"email": "duplicate"})

    if nik:
        existing_nik_user = User.query.filter_by(nik=nik).first()
        if existing_nik_user:
            if existing_nik_user.status == 'rejected':
                from app.models.badge import UserBadge
                from app.models.mission import UserMission
                from app.models.participation_risk import ParticipationRisk
                from app.models.reward import RewardRedemption
                from app.models.waste_deposit import WasteDeposit

                UserBadge.query.filter_by(user_id=existing_nik_user.id).delete(synchronize_session=False)
                UserMission.query.filter_by(user_id=existing_nik_user.id).delete(synchronize_session=False)
                ParticipationRisk.query.filter_by(user_id=existing_nik_user.id).delete(synchronize_session=False)
                RewardRedemption.query.filter_by(user_id=existing_nik_user.id).delete(synchronize_session=False)
                WasteDeposit.query.filter_by(user_id=existing_nik_user.id).delete(synchronize_session=False)
                db.session.delete(existing_nik_user)
                db.session.commit()
            else:
                return error_response("NIK sudah terdaftar", "conflict", status=409, fields={"nik": "duplicate"})

    ktp_image_url = None
    if ktp_file:
        ktp_image_url = _save_ktp_image(ktp_file)

    while True:
        account_number = f"SRK-{random.randint(100000, 999999)}"
        if not User.query.filter_by(account_number=account_number).first():
            break

    if gender:
        gender_upper = gender.upper()
        if gender_upper in ('L', 'LAKI-LAKI', 'LAKI LAKI', 'PRIA', 'MALE', 'M'):
            gender = 'Laki-Laki'
        elif gender_upper in ('P', 'PEREMPUAN', 'WANITA', 'FEMALE', 'F'):
            gender = 'Perempuan'
        else:
            gender = None

    user = User(
        name=name,
        email=email,
        phone=phone or None,
        account_number=account_number,
        gender=gender,
        nik=nik,
        ktp_image_url=ktp_image_url,
        address=address,
        role='member',
        status='pending',
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Registrasi berhasil! Akun Anda sedang menunggu verifikasi oleh admin.",
        "user": user.to_dict(),
        "status": "pending",
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with email and password, returns JWT tokens."""
    data = request.get_json()

    if not data:
        return error_response("Request body tidak boleh kosong", "validation_error", status=400)

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return error_response(
            "Email dan password wajib diisi",
            "validation_error",
            status=400,
            fields={
                "email": "required" if not email else None,
                "password": "required" if not password else None,
            },
        )

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return error_response("Email atau password salah", "unauthorized", status=401)

    if user.status == 'pending':
        return error_response(
            "Akun Anda masih menunggu verifikasi admin. Silakan tunggu hingga akun diverifikasi.",
            "account_pending",
            status=403,
        )

    if user.status == 'rejected':
        return error_response(
            "Akun Anda telah ditolak oleh admin. Silakan hubungi admin untuk informasi lebih lanjut.",
            "account_rejected",
            status=403,
        )

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "message": "Login berhasil",
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh expired access token using refresh token."""
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)

    return jsonify({
        "access_token": access_token,
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    """Get current authenticated user profile."""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))

    if not user:
        return error_response("User tidak ditemukan", "not_found", status=404)

    return jsonify({
        "user": user.to_dict(),
    }), 200


@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_me():
    """Update current authenticated user profile fields."""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))

    if not user:
        return error_response("User tidak ditemukan", "not_found", status=404)

    data = request.get_json()
    if not data:
        return error_response("Request body tidak boleh kosong", "validation_error", status=400)

    if 'name' in data:
        user.name = (data.get('name') or '').strip()
    if 'email' in data:
        user.email = (data.get('email') or '').strip().lower()
    if 'phone' in data:
        user.phone = (data.get('phone') or '').strip() or None
    if 'account_number' in data:
        user.account_number = (data.get('account_number') or '').strip().upper() or None
    if 'gender' in data:
        user.gender = (data.get('gender') or '').strip() or None
    if 'nik' in data:
        user.nik = (data.get('nik') or '').strip() or None
    if 'address' in data:
        user.address = (data.get('address') or '').strip() or None
    if 'department' in data:
        user.department = (data.get('department') or '').strip() or None

    if not user.name:
        return error_response("Nama wajib diisi", "validation_error", status=400, fields={"name": "required"})
    if not user.email:
        return error_response("Email wajib diisi", "validation_error", status=400, fields={"email": "required"})

    email_exists = User.query.filter(
        User.email == user.email,
        User.id != user.id,
    ).first()
    if email_exists:
        return error_response("Email sudah digunakan user lain", "conflict", status=409, fields={"email": "duplicate"})

    if user.account_number:
        account_exists = User.query.filter(
            User.account_number == user.account_number,
            User.id != user.id,
        ).first()
        if account_exists:
            return error_response(
                "Nomor rekening sudah digunakan user lain",
                "conflict",
                status=409,
                fields={"account_number": "duplicate"},
            )

    db.session.commit()

    return jsonify({
        "message": "Profil berhasil diperbarui",
        "user": user.to_dict(),
    }), 200
