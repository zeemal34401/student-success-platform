import pandas as pd
from sklearn.preprocessing import LabelEncoder
import joblib
import os
from paths import MODELS_DIR, XAPI_PATH

os.makedirs(MODELS_DIR, exist_ok=True)


def load_xapi_data():
    return pd.read_csv(XAPI_PATH)


def encode_and_prepare_xapi(df, dataset_name="xapi"):
    df = df.copy()

    # Binary framing: High/Middle performers = 1 (on-track), Low = 0 (at-risk)
    # This matches your other Model 1 variants (binary at-risk classification)
    df["target"] = (df["Class"] != "L").astype(int)
    df = df.drop(columns=["Class"])

    cat_cols = df.select_dtypes(include="object").columns.tolist()
    encoders = {}
    for col in cat_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le

    encoder_path = os.path.join(MODELS_DIR, f"{dataset_name}_encoders.pkl")
    joblib.dump(encoders, encoder_path)
    print(f"Saved encoders: {encoder_path}")

    X = df.drop(columns=["target"])
    y = df["target"]
    return X, y
