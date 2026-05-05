"""
Verify that all ML model files load correctly.
Run this script to test model loading and make a sample prediction.

Usage:
    python load_models.py
"""
import os
import sys
import joblib
import numpy as np

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'model'))


def main():
    print("=" * 60)
    print("🔍 Sirkula ML — Model Verification")
    print("=" * 60)
    print(f"\nModel directory: {MODEL_DIR}\n")

    # 1. Load Random Forest Model
    model_path = os.path.join(MODEL_DIR, 'random_forest_model.pkl')
    print(f"📦 Loading model: {model_path}")
    try:
        model = joblib.load(model_path)
        print(f"   ✅ Model type: {type(model).__name__}")
        if hasattr(model, 'n_estimators'):
            print(f"   📊 Estimators: {model.n_estimators}")
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            features = ['recency', 'frequency', 'consistency']
            print(f"   📊 Feature importances:")
            for feat, imp in zip(features, importances):
                print(f"      - {feat}: {imp:.4f}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        sys.exit(1)

    # 2. Load Label Encoder
    encoder_path = os.path.join(MODEL_DIR, 'label_encoder.pkl')
    print(f"\n📦 Loading encoder: {encoder_path}")
    try:
        label_encoder = joblib.load(encoder_path)
        print(f"   ✅ Classes: {list(label_encoder.classes_)}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        sys.exit(1)

    # 3. Load Thresholds
    thresholds_path = os.path.join(MODEL_DIR, 'thresholds.pkl')
    print(f"\n📦 Loading thresholds: {thresholds_path}")
    try:
        thresholds = joblib.load(thresholds_path)
        print(f"   ✅ Thresholds: {thresholds}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        sys.exit(1)

    # 4. Sample Predictions
    print("\n" + "=" * 60)
    print("🧪 Sample Predictions")
    print("=" * 60)

    test_cases = [
        {'recency': 5, 'frequency': 20, 'consistency': 0.9, 'expected': 'Low Risk (active user)'},
        {'recency': 30, 'frequency': 5, 'consistency': 0.4, 'expected': 'Medium Risk (declining)'},
        {'recency': 90, 'frequency': 1, 'consistency': 0.1, 'expected': 'High Risk (inactive)'},
    ]

    for i, tc in enumerate(test_cases, 1):
        features = np.array([[tc['recency'], tc['frequency'], tc['consistency']]])
        prediction = model.predict(features)[0]
        proba = model.predict_proba(features)[0]
        risk_level = label_encoder.inverse_transform([prediction])[0]
        confidence = max(proba) * 100

        print(f"\n   Test {i}: {tc['expected']}")
        print(f"   Input:  R={tc['recency']}, F={tc['frequency']}, C={tc['consistency']}")
        print(f"   Result: {risk_level} (confidence: {confidence:.1f}%)")
        print(f"   Probabilities: {dict(zip(label_encoder.classes_, [f'{p:.2%}' for p in proba]))}")

    print("\n" + "=" * 60)
    print("✅ All models loaded & verified successfully!")
    print("=" * 60)


if __name__ == '__main__':
    main()
