import pandas as pd
from preprocessing import DATA_PATH

path = DATA_PATH
df = pd.read_csv(path, sep=";")
df.columns = [c.strip() for c in df.columns]
print("Shape:", df.shape)
print("Columns:", list(df.columns))
print("Target value counts:\n", df["Target"].value_counts())
print(df.head(3))
