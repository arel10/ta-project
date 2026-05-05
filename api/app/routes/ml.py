from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.services.ml_service import predict_single, predict_batch, get_risk_summary, get_risk_trend

ml_bp = Blueprint('ml', __name__)


def _get_current_user():
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)


def _require_admin(user):
    if not user or not user.is_admin:
        return jsonify({"message": "Akses ditolak, hanya admin"}), 403
    return None


@ml_bp.route('/analyze/<int:user_id>', methods=['POST'])
@jwt_required()
def analyze_user(user_id):
    """Admin triggers ML risk analysis for a single user."""
    try:
        admin = _get_current_user()
        admin_check = _require_admin(admin)
        if admin_check:
            return admin_check

        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({"message": "User tidak ditemukan"}), 404

        result = predict_single(user_id)

        if result is None:
            return jsonify({
                "message": "Tidak dapat menganalisis user. Pastikan user memiliki setoran tervalidasi dan ML Service aktif."
            }), 400

        return jsonify({
            "message": "Analisis risiko berhasil",
            "risk_profile": result,
        }), 200
    except Exception as e:
        return jsonify({
            "message": "Terjadi kesalahan saat analisis user",
            "error": str(e),
        }), 500


@ml_bp.route('/analyze/all', methods=['POST'])
@jwt_required()
def analyze_all_users():
    """Admin triggers batch ML risk analysis for all users."""
    try:
        admin = _get_current_user()
        admin_check = _require_admin(admin)
        if admin_check:
            return admin_check

        batch = predict_batch()
        total_saved = int(batch.get('total_saved', 0))
        total_requested = int(batch.get('total_requested', 0))
        total_errors = int(batch.get('total_errors', 0))

        if total_requested > 0 and total_saved == 0:
            return jsonify({
                "message": "Analisis batch gagal menyimpan hasil. Periksa ML Service atau timeout.",
                "total_requested": total_requested,
                "total_analyzed": total_saved,
                "total_errors": total_errors,
            }), 500

        return jsonify({
            "message": f"Analisis batch selesai untuk {total_saved} user",
            "total_requested": total_requested,
            "total_analyzed": total_saved,
            "total_errors": total_errors,
            "results": batch.get('results', []),
        }), 200
    except Exception as e:
        return jsonify({
            "message": "Terjadi kesalahan saat analisis batch",
            "error": str(e),
        }), 500


@ml_bp.route('/risk-summary', methods=['GET'])
@jwt_required()
def risk_summary():
    """Admin dashboard: risk level distribution and high-risk user list."""
    admin = _get_current_user()
    admin_check = _require_admin(admin)
    if admin_check:
        return admin_check

    summary = get_risk_summary()

    return jsonify(summary), 200


@ml_bp.route('/risk-trend', methods=['GET'])
@jwt_required()
def risk_trend():
    """Admin dashboard: real monthly risk distribution."""
    admin = _get_current_user()
    admin_check = _require_admin(admin)
    if admin_check:
        return admin_check

    trend = get_risk_trend(months=6)
    return jsonify({"data": trend}), 200
