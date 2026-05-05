from flask import jsonify


def error_response(message: str, code: str, status: int = 400, fields: dict | None = None):
    clean_fields = {k: v for k, v in (fields or {}).items() if v is not None}
    payload = {
        "error": {
            "code": code,
            "message": message,
            "fields": clean_fields,
        }
    }
    return jsonify(payload), status
