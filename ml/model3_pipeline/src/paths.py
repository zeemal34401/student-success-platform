"""Portable path configuration for model3_pipeline."""
import os

_PIPELINE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ML_ROOT = os.path.dirname(_PIPELINE_DIR)
MODELS_DIR = os.path.join(_PIPELINE_DIR, "models")
OUTPUTS_DIR = os.path.join(_PIPELINE_DIR, "outputs")
MASTERY_PATH = os.path.join(_PIPELINE_DIR, "student_kc_mastery.csv")
_DATASETS = os.environ.get("ML_DATASETS_DIR", os.path.join(ML_ROOT, "datasets"))
KDD_CUP_PATH = os.path.join(
    _DATASETS,
    "model3(recommender)",
    "algebra_2006_2007",
    "algebra_2006_2007_train.txt",
)
DATA_PATH = KDD_CUP_PATH

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)
