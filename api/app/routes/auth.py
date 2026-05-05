import random
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from app import db
from app.models.user import User
from app.utils.api_response import error_response

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new member account."""
    data = request.get_json()

    if not data:
        return error_response("Request body tidak boleh kosong", "validation_error", status=400)

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    # Validation
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

    if User.query.filter_by(email=email).first():
        return error_response("Email sudah terdaftar", "conflict", status=409, fields={"email": "duplicate"})

    # Generate unique account number
    while True:
        account_number = f"SRK-{random.randint(100000, 999999)}"
        if not User.query.filter_by(account_number=account_number).first():
            break

    user = User(
        name=name,
        email=email,
        account_number=account_number,
        role='member',
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "message": "Registrasi berhasil",
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
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
