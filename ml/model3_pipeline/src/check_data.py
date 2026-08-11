import pandas as pd
from paths import KDD_CUP_PATH

path = KDD_CUP_PATH
df = pd.read_csv(path, sep="\t", nrows=5)
print("Path:", path)
print("Sample rows:", len(df))
print(df.head())
