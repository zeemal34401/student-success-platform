import sys, os
sys.path.append(os.path.dirname(__file__))

from preprocessing_xapi import load_xapi_data, encode_and_prepare_xapi, MODELS_DIR

import joblib
import shap
import matplotlib.pyplot as plt
from paths import OUTPUTS_DIR

os.makedirs(OUTPUTS_DIR, exist_ok=True)

print("Generating SHAP plot for xAPI model...")

df = load_xapi_data()
X, y = encode_and_prepare_xapi(df, dataset_name="xapi_shap")  # separate encoder save, avoids overwriting the training one

model = joblib.load(os.path.join(MODELS_DIR, "xapi_xgb_model.pkl"))

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X)

plt.figure()
shap.summary_plot(shap_values, X, show=False, max_display=16)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUTS_DIR, "shap_xapi.png"), dpi=150)
plt.close()

print("Saved shap_xapi.png")
