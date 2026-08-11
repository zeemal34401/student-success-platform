from preprocessing import load_and_merge_oulad, prepare_for_clustering

df = load_and_merge_oulad()
X_scaled, meta, features = prepare_for_clustering(df)

print("Merged shape:", df.shape)
print("Clustering feature matrix shape:", X_scaled.shape)
print("Features used:", features)
print("\nScaled data sample:\n", X_scaled.head())
print("\nMeta sample:\n", meta.head())