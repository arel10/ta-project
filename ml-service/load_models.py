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

FEATURE_COLUMNS = [
    'recency', 'frequency', 'consistency', 'avg_interval',
    'std_interval', 'avg_berat', 'trend_berat', 'days_active',
]


def main():
    print("=" * 60)
    print("🔍 Sirkula ML — Churn Model Verification")
    print("=" * 60)
    print(f"\nModel directory: {MODEL_DIR}\n")

    # 1. Load Churn Model
    model_path = os.path.join(MODEL_DIR, 'churn_model.pkl')
    print(f"📦 Loading model: {model_path}")
    try:
        model = joblib.load(model_path)
        print(f"   ✅ Model type: {type(model).__name__}")
        if hasattr(model, 'n_estimators'):
            print(f"   📊 Estimators: {model.n_estimators}")
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            print(f"   📊 Feature importances:")
            for feat, imp in zip(FEATURE_COLUMNS, importances):
                print(f"      - {feat}: {imp:.4f}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        sys.exit(1)

    # 2. Load Metadata
    metadata_path = os.path.join(MODEL_DIR, 'churn_metadata.pkl')
    print(f"\n📦 Loading metadata: {metadata_path}")
    try:
        metadata = joblib.load(metadata_path)
        print(f"   ✅ Metadata loaded:")
        for key, val in metadata.items():
            print(f"      - {key}: {val}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        sys.exit(1)

    # 3. Sample Predictions
    print("\n" + "=" * 60)
    print("🧪 Sample Churn Predictions")
    print("=" * 60)

    threshold = metadata.get('best_threshold', 0.5)
    print(f"   Using threshold: {threshold}")

    test_cases = [
        {
            'recency': 5, 'frequency': 50, 'consistency': 0.9,
            'avg_interval': 7, 'std_interval': 3, 'avg_berat': 2.5,
            'trend_berat': 0.1, 'days_active': 350,
            'expected': 'NOT CHURN (active user)',
        },
        {
            'recency': 45, 'frequency': 10, 'consistency': 0.4,
            'avg_interval': 30, 'std_interval': 15, 'avg_berat': 1.2,
            'trend_berat': -0.05, 'days_active': 200,
            'expected': 'POSSIBLY CHURN (declining)',
        },
        {
            'recency': 120, 'frequency': 3, 'consistency': 0.2,
            'avg_interval': 60, 'std_interval': 40, 'avg_berat': 0.5,
            'trend_berat': -0.2, 'days_active': 90,
            'expected': 'LIKELY CHURN (inactive)',
        },
    ]

    for i, tc in enumerate(test_cases, 1):
        features = np.array([[
            tc['recency'], tc['frequency'], tc['consistency'],
            tc['avg_interval'], tc['std_interval'], tc['avg_berat'],
            tc['trend_berat'], tc['days_active'],
        ]])
        prediction = model.predict(features)[0]
        proba = model.predict_proba(features)[0]
        churn_prob = proba[1] if len(proba) > 1 else proba[0]
        will_churn = churn_prob >= threshold

        print(f"\n   Test {i}: {tc['expected']}")
        print(f"   Input:  R={tc['recency']}, F={tc['frequency']}, C={tc['consistency']}, "
              f"AvgI={tc['avg_interval']}, StdI={tc['std_interval']}, "
              f"AvgB={tc['avg_berat']}, TrB={tc['trend_berat']}, DA={tc['days_active']}")
        print(f"   Result: {'CHURN' if will_churn else 'NOT CHURN'} "
              f"(probability: {churn_prob:.1%})")
        print(f"   Raw Probabilities: [Not Churn: {proba[0]:.2%}, Churn: {proba[1]:.2%}]")

    print("\n" + "=" * 60)
    print("✅ Churn model loaded & verified successfully!")
    print("=" * 60)


if __name__ == '__main__':
    main()
