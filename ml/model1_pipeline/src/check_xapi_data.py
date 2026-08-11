import pandas as pd
from paths import XAPI_PATH

path = XAPI_PATH
df = pd.read_csv(path, nrows=5)
print("Path:", path)
print(df.head())
