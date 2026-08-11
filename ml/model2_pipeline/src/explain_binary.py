import sys, os
sys.path.append(os.path.dirname(__file__))

from preprocessing import (
    load_dropout_data,
    prepare_binary,
    encode_features,
    MODELS_DIR,
    OUTPUTS_DIR,
)

import joblib
import shap
import matplotlib.pyplot as plt

os.makedirs(OUTPUTS_DIR, exist_ok=True)

print("Generating SHAP plot for binary dropout model...")

df = load_dropout_data()
df = prepare_binary(df)
X, _ = encode_features(df, target_col="target", dataset_name="binary", engineer=True)

artifact = joblib.load(os.path.join(MODELS_DIR, "dropout_binary_xgb_model.pkl"))
model = artifact["model"] if isinstance(artifact, dict) else artifact
# SHAP TreeExplainer works best on a single tree booster; prefer xgb if ensemble
if hasattr(model, "named_estimators_"):
    shap_model = model.named_estimators_.get("xgb", list(model.named_estimators_.values())[0])
else:
    shap_model = model

explainer = shap.TreeExplainer(shap_model)
shap_values = explainer.shap_values(X)

plt.figure()
shap.summary_plot(shap_values, X, show=False, max_display=15)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUTS_DIR, "shap_binary_dropout.png"), dpi=150)
plt.close()

print("Saved shap_binary_dropout.png")