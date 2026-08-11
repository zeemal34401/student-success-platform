import os
import joblib
import pandas as pd
from sklearn.preprocessing import LabelEncoder

_PIPELINE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(_PIPELINE_DIR, "data", "data.csv")
MODELS_DIR = os.path.join(_PIPELINE_DIR, "models")
OUTPUTS_DIR = os.path.join(_PIPELINE_DIR, "outputs")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)


def load_dropout_data():
    """Load the raw UCI dropout dataset."""
    df = pd.read_csv(DATA_PATH, sep=";")
    # Clean up a known messy column name (has a trailing tab character)
    df.columns = [c.strip() for c in df.columns]
    return df


def prepare_binary(df):
    """
    Binary framing: Dropout = 1 (at-risk) vs Graduate = 0.

    Students still marked Enrolled are excluded because their final outcome is
    unresolved; including them as "not dropout" injects label noise and caps
    accuracy near ~88%. Dropout-vs-Graduate is the clean deployable risk task.
    """
    df = df.copy()
    df = df[df["Target"].isin(["Dropout", "Graduate"])].reset_index(drop=True)
    df["target"] = (df["Target"] == "Dropout").astype(int)
    df = df.drop(columns=["Target"])
    return df


def prepare_multiclass(df):
    """
    3-class framing: Dropout / Enrolled / Graduate.
    Secondary analytical model for richer institutional reporting.
    """
    df = df.copy()
    le = LabelEncoder()
    df["target"] = le.fit_transform(df["Target"])  # Dropout=0, Enrolled=1, Graduate=2 (alphabetical)
    joblib.dump(le, os.path.join(MODELS_DIR, "multiclass_target_encoder.pkl"))
    df = df.drop(columns=["Target"])
    return df, le


def engineer_features(df):
    """
    Add derived academic-progress features that improve discrimination
    without changing the original UCI columns used for API input.
    """
    df = df.copy()

    def safe_div(num, den):
        return num / den.replace(0, pd.NA)

    df["approval_rate_1st"] = safe_div(
        df["Curricular units 1st sem (approved)"],
        df["Curricular units 1st sem (enrolled)"],
    ).fillna(0)
    df["approval_rate_2nd"] = safe_div(
        df["Curricular units 2nd sem (approved)"],
        df["Curricular units 2nd sem (enrolled)"],
    ).fillna(0)
    df["eval_rate_1st"] = safe_div(
        df["Curricular units 1st sem (evaluations)"],
        df["Curricular units 1st sem (enrolled)"],
    ).fillna(0)
    df["eval_rate_2nd"] = safe_div(
        df["Curricular units 2nd sem (evaluations)"],
        df["Curricular units 2nd sem (enrolled)"],
    ).fillna(0)
    df["grade_delta"] = (
        df["Curricular units 2nd sem (grade)"] - df["Curricular units 1st sem (grade)"]
    )
    df["approved_delta"] = (
        df["Curricular units 2nd sem (approved)"] - df["Curricular units 1st sem (approved)"]
    )
    df["total_approved"] = (
        df["Curricular units 1st sem (approved)"] + df["Curricular units 2nd sem (approved)"]
    )
    df["total_failed_signal"] = (
        df["Curricular units 1st sem (enrolled)"]
        - df["Curricular units 1st sem (approved)"]
        + df["Curricular units 2nd sem (enrolled)"]
        - df["Curricular units 2nd sem (approved)"]
    )
    df["avg_grade"] = (
        df["Curricular units 1st sem (grade)"] + df["Curricular units 2nd sem (grade)"]
    ) / 2.0
    df["financial_stress"] = (
        (1 - df["Tuition fees up to date"]) + df["Debtor"]
    ).astype(float)

    return df


def encode_features(df, target_col, dataset_name, engineer=True):
    """
    Encodes any remaining categorical columns and optionally adds engineered features.
    """
    df = df.fillna(0)
    if engineer:
        df = engineer_features(df)

    cat_cols = df.select_dtypes(include="object").columns.tolist()
    encoders = {}

    for col in cat_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le

    if encoders:
        encoder_path = os.path.join(MODELS_DIR, f"{dataset_name}_feature_encoders.pkl")
        joblib.dump(encoders, encoder_path)
        print(f"Saved feature encoders: {encoder_path}")
    else:
        print("No categorical features needed encoding (dataset is pre-numeric-coded).")

    X = df.drop(columns=[target_col])
    y = df[target_col]
    return X, y
