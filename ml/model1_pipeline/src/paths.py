"""Portable path configuration for model1_pipeline."""
import os

_PIPELINE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ML_ROOT = os.path.dirname(_PIPELINE_DIR)
MODELS_DIR = os.path.join(_PIPELINE_DIR, "models")
OUTPUTS_DIR = os.path.join(_PIPELINE_DIR, "outputs")
_DATASETS = os.environ.get("ML_DATASETS_DIR", os.path.join(ML_ROOT, "datasets"))
OULAD_BASE = os.path.join(_DATASETS, "model1(prediction)", "archive(3)")
STUDENT_BASE = os.path.join(_DATASETS, "model1(prediction)", "student+performance", "student")
XAPI_PATH = os.path.join(_DATASETS, "model1(prediction)", "xAPI-Edu-Data.csv")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)
