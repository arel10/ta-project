"""
Sirkula ML Service — Churn Risk Prediction Microservice.

Loads pre-trained Random Forest model and serves predictions
for member participation risk levels (low/medium/high).
"""
import os
import logging
import warnings
import joblib
import numpy as np
from flask import Flask, request, jsonify

warnings.filterwarnings(
    "ignore",
    message=r"`sklearn\.utils\.parallel\.delayed` should be used with `sklearn\.utils\.parallel\.Parallel`.*",
    category=UserWarning,
)

# ─── Configuration ────────────────────────────────────────────────────

MODEL_DIR = os.getenv('MODEL_DIR', os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'model')))
HOST = os.getenv('ML_HOST', '0.0.0.0')
PORT = int(os.getenv('ML_PORT', 5001))

# ─── Logging ──────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
)
logger = logging.getLogger(__name__)

# ─── Model Loading ────────────────────────────────────────────────────

model = None
label_encoder = None
thresholds = None


def load_models():
    """Load all pickle files on startup."""
    global model, label_encoder, thresholds

    model_path = os.path.join(MODEL_DIR, 'random_forest_model.pkl')
    encoder_path = os.path.join(MODEL_DIR, 'label_encoder.pkl')
    thresholds_path = os.path.join(MODEL_DIR, 'thresholds.pkl')

    try:
        logger.info(f"Loading model from: {model_path}")
        model = joblib.load(model_path)
        logger.info(f"✅ Model loaded: {type(model).__name__}")
    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}")
        model = None

    try:
        logger.info(f"Loading label encoder from: {encoder_path}")
        label_encoder = joblib.load(encoder_path)
        logger.info(f"✅ Label encoder loaded. Classes: {list(label_encoder.classes_)}")
    except Exception as e:
        logger.error(f"❌ Failed to load label encoder: {e}")
        label_encoder = None

    try:
        logger.info(f"Loading thresholds from: {thresholds_path}")
        thresholds = joblib.load(thresholds_path)
        logger.info(f"✅ Thresholds loaded: {thresholds}")
    except Exception as e:
        logger.error(f"❌ Failed to load thresholds: {e}")
        thresholds = None


def predict_risk(recency: int, frequency: int, consistency: float) -> dict:
    """
    Run prediction using the loaded model.
    Returns risk_level and confidence_score.
    """
    if model is None or label_encoder is None:
        raise RuntimeError("Model not loaded")

    features = np.array([[recency, frequency, consistency]])
    prediction_encoded = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]

    # Decode label
    risk_level = label_encoder.inverse_transform([prediction_encoded])[0]
    confidence_score = float(max(probabilities))

    return {
        'risk_level': risk_level,
        'confidence_score': round(confidence_score, 4),
    }


# ─── Flask App ────────────────────────────────────────────────────────

app = Flask(__name__)


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'sirkula-ml-service',
        'model_loaded': model is not None,
        'encoder_loaded': label_encoder is not None,
        'thresholds_loaded': thresholds is not None,
    }), 200


@app.route('/predict', methods=['POST'])
def predict():
    """
    Single user prediction.
    Expects JSON: {user_id, recency, frequency, consistency}
    Returns: {user_id, risk_level, confidence_score}
    """
    if model is None or label_encoder is None:
        return jsonify({'error': 'Model not loaded'}), 503

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    try:
        user_id = data.get('user_id')
        recency = int(data['recency'])
        frequency = int(data['frequency'])
        consistency = float(data['consistency'])
    except (KeyError, ValueError, TypeError) as e:
        return jsonify({'error': f'Invalid input: {e}'}), 400

    try:
        result = predict_risk(recency, frequency, consistency)
        logger.info(
            f"Prediction — user_id={user_id}, "
            f"R={recency}, F={frequency}, C={consistency:.4f} "
            f"→ {result['risk_level']} ({result['confidence_score']:.2%})"
        )

        return jsonify({
            'user_id': user_id,
            **result,
        }), 200

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """
    Batch prediction for multiple users.
    Expects JSON: [{user_id, recency, frequency, consistency}, ...]
    Returns: {predictions: [{user_id, risk_level, confidence_score}, ...]}
    """
    if model is None or label_encoder is None:
        return jsonify({'error': 'Model not loaded'}), 503

    data = request.get_json()
    if not data or not isinstance(data, list):
        return jsonify({'error': 'Expected a JSON array of user feature objects'}), 400

    predictions = []
    errors = []

    for item in data:
        try:
            user_id = item.get('user_id')
            recency = int(item['recency'])
            frequency = int(item['frequency'])
            consistency = float(item['consistency'])

            result = predict_risk(recency, frequency, consistency)
            predictions.append({
                'user_id': user_id,
                **result,
            })

            logger.info(
                f"Batch — user_id={user_id}, "
                f"R={recency}, F={frequency}, C={consistency:.4f} "
                f"→ {result['risk_level']}"
            )

        except Exception as e:
            errors.append({
                'user_id': item.get('user_id'),
                'error': str(e),
            })
            logger.error(f"Batch prediction error for user {item.get('user_id')}: {e}")

    return jsonify({
        'predictions': predictions,
        'errors': errors,
        'total_predicted': len(predictions),
        'total_errors': len(errors),
    }), 200


@app.route('/model/info', methods=['GET'])
def model_info():
    """Get information about the loaded model."""
    info = {
        'model_type': type(model).__name__ if model else None,
        'model_loaded': model is not None,
    }

    if model and hasattr(model, 'n_estimators'):
        info['n_estimators'] = model.n_estimators
    if model and hasattr(model, 'feature_importances_'):
        info['feature_importances'] = {
            'recency': float(model.feature_importances_[0]),
            'frequency': float(model.feature_importances_[1]),
            'consistency': float(model.feature_importances_[2]),
        }
    if label_encoder:
        info['classes'] = list(label_encoder.classes_)
    if thresholds:
        info['thresholds'] = thresholds

    return jsonify(info), 200


# ─── Startup ──────────────────────────────────────────────────────────

load_models()

if __name__ == '__main__':
    app.run(host=HOST, port=PORT, debug=True)
