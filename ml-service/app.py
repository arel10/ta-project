"""
Sirkula ML Service — Churn Prediction Microservice.

Loads pre-trained Random Forest model and serves churn predictions
for member participation (will churn / will not churn in 60 days).

Development:
    python app.py

Production:
    gunicorn --bind 127.0.0.1:5001 --workers 2 --timeout 120 "app:app"
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
metadata = None

FEATURE_COLUMNS = [
    'recency', 'frequency', 'consistency', 'avg_interval',
    'std_interval', 'avg_berat', 'trend_berat', 'days_active',
]


def load_models():
    """Load churn model and metadata on startup."""
    global model, metadata

    model_path = os.path.join(MODEL_DIR, 'churn_model.pkl')
    metadata_path = os.path.join(MODEL_DIR, 'churn_metadata.pkl')

    try:
        logger.info(f"Loading churn model from: {model_path}")
        model = joblib.load(model_path)
        logger.info(f"✅ Model loaded: {type(model).__name__}")
    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}")
        model = None

    try:
        logger.info(f"Loading metadata from: {metadata_path}")
        metadata = joblib.load(metadata_path)
        logger.info(f"✅ Metadata loaded: {metadata}")
    except Exception as e:
        logger.error(f"❌ Failed to load metadata: {e}")
        metadata = None


def predict_churn(recency, frequency, consistency, avg_interval,
                  std_interval, avg_berat, trend_berat, days_active) -> dict:
    """
    Run churn prediction using the loaded model.
    Returns will_churn, churn_probability, and confidence_score.
    """
    if model is None:
        raise RuntimeError("Model not loaded")

    features = np.array([[recency, frequency, consistency, avg_interval,
                          std_interval, avg_berat, trend_berat, days_active]])

    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]

    # Get optimal threshold from metadata (default 0.5)
    threshold = 0.5
    if metadata and 'best_threshold' in metadata:
        threshold = metadata['best_threshold']

    # Probability of churn (class 1)
    churn_prob = float(probabilities[1]) if len(probabilities) > 1 else float(probabilities[0])

    # Apply optimal threshold
    will_churn = bool(churn_prob >= threshold)

    return {
        'will_churn': will_churn,
        'churn_probability': round(churn_prob, 4),
        'confidence_score': round(float(max(probabilities)), 4),
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
        'metadata_loaded': metadata is not None,
        'model_type': 'churn_prediction',
    }), 200


@app.route('/predict', methods=['POST'])
def predict():
    """
    Single user churn prediction.
    Expects JSON: {user_id, recency, frequency, consistency,
                   avg_interval, std_interval, avg_berat, trend_berat, days_active}
    Returns: {user_id, will_churn, churn_probability, confidence_score}
    """
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 503

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    try:
        user_id = data.get('user_id')
        recency = int(data['recency'])
        frequency = int(data['frequency'])
        consistency = float(data['consistency'])
        avg_interval = float(data.get('avg_interval', 0))
        std_interval = float(data.get('std_interval', 0))
        avg_berat = float(data.get('avg_berat', 0))
        trend_berat = float(data.get('trend_berat', 0))
        days_active = int(data.get('days_active', 0))
    except (KeyError, ValueError, TypeError) as e:
        return jsonify({'error': f'Invalid input: {e}'}), 400

    try:
        result = predict_churn(recency, frequency, consistency, avg_interval,
                               std_interval, avg_berat, trend_berat, days_active)
        logger.info(
            f"Prediction — user_id={user_id}, "
            f"R={recency}, F={frequency}, C={consistency:.4f}, "
            f"AvgInt={avg_interval:.1f}, StdInt={std_interval:.1f}, "
            f"AvgBerat={avg_berat:.2f}, Trend={trend_berat:.3f}, DaysAct={days_active} "
            f"→ {'CHURN' if result['will_churn'] else 'NOT CHURN'} "
            f"(prob={result['churn_probability']:.2%})"
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
    Batch churn prediction for multiple users.
    Expects JSON: [{user_id, recency, frequency, consistency, ...}, ...]
    Returns: {predictions: [{user_id, will_churn, churn_probability, ...}, ...]}
    """
    if model is None:
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
            avg_interval = float(item.get('avg_interval', 0))
            std_interval = float(item.get('std_interval', 0))
            avg_berat = float(item.get('avg_berat', 0))
            trend_berat = float(item.get('trend_berat', 0))
            days_active = int(item.get('days_active', 0))

            result = predict_churn(recency, frequency, consistency, avg_interval,
                                   std_interval, avg_berat, trend_berat, days_active)
            predictions.append({
                'user_id': user_id,
                **result,
            })

            logger.info(
                f"Batch — user_id={user_id}, "
                f"R={recency}, F={frequency}, C={consistency:.4f}, "
                f"AvgInt={avg_interval:.1f}, StdInt={std_interval:.1f}, "
                f"AvgBerat={avg_berat:.2f}, Trend={trend_berat:.3f}, DaysAct={days_active} "
                f"→ {'CHURN' if result['will_churn'] else 'NOT CHURN'} "
                f"(prob={result['churn_probability']:.2%})"
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
        'prediction_type': 'churn_prediction',
        'feature_columns': FEATURE_COLUMNS,
    }

    if model and hasattr(model, 'n_estimators'):
        info['n_estimators'] = model.n_estimators
    if model and hasattr(model, 'feature_importances_'):
        info['feature_importances'] = {
            col: float(imp) for col, imp in zip(FEATURE_COLUMNS, model.feature_importances_)
        }
    if metadata:
        info['metadata'] = {
            'churn_window_days': metadata.get('churn_window_days'),
            'best_threshold': metadata.get('best_threshold'),
            'test_accuracy': metadata.get('test_accuracy'),
            'test_f1': metadata.get('test_f1'),
            'test_auc': metadata.get('test_auc'),
        }

    return jsonify(info), 200


# ─── Startup ──────────────────────────────────────────────────────────

load_models()

if __name__ == '__main__':
    debug = os.getenv('FLASK_DEBUG', '0') == '1'
    app.run(host=HOST, port=PORT, debug=debug)
