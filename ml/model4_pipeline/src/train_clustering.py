import sys, os
sys.path.append(os.path.dirname(__file__))

from preprocessing import load_and_merge_oulad, prepare_for_clustering, MODELS_DIR

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
from paths import OUTPUTS_DIR

os.makedirs(OUTPUTS_DIR, exist_ok=True)

# ===== Load and prepare =====
df = load_and_merge_oulad()
X_scaled, meta, features = prepare_for_clustering(df)
X_scaled = X_scaled.reset_index(drop=True)
meta = meta.reset_index(drop=True)

# ===== Elbow method + silhouette score to choose K =====
print("Evaluating cluster counts (this may take a minute)...")
inertias = []
silhouettes = []
K_range = range(2, 8)

sample_df = X_scaled.sample(n=5000, random_state=42)

for k in K_range:
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    km.fit(X_scaled)
    inertias.append(km.inertia_)

    sample_labels = km.predict(sample_df)
    sil = silhouette_score(sample_df, sample_labels)
    silhouettes.append(sil)
    print(f"  k={k}: inertia={km.inertia_:.1f}, silhouette={sil:.3f}")

# ===== Plot elbow curve =====
fig, axes = plt.subplots(1, 2, figsize=(12, 5))
axes[0].plot(list(K_range), inertias, marker="o")
axes[0].set_xlabel("Number of clusters (k)")
axes[0].set_ylabel("Inertia")
axes[0].set_title("Elbow Method")

axes[1].plot(list(K_range), silhouettes, marker="o", color="orange")
axes[1].set_xlabel("Number of clusters (k)")
axes[1].set_ylabel("Silhouette Score")
axes[1].set_title("Silhouette Score by k")

plt.tight_layout()
plt.savefig(os.path.join(OUTPUTS_DIR, "cluster_selection.png"), dpi=150)
plt.close()
print("\nSaved cluster selection plot to outputs folder.")

# ===== Fit final K-Means (using best silhouette score) =====
best_k = list(K_range)[int(np.argmax(silhouettes))]
print(f"\nBest k based on silhouette score: {best_k}")

kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10)
cluster_labels = kmeans.fit_predict(X_scaled)

meta["cluster"] = cluster_labels
X_scaled["cluster"] = cluster_labels

# ===== PCA for 2D visualization =====
pca = PCA(n_components=2)
pca_coords = pca.fit_transform(X_scaled[features])
meta["pca_x"] = pca_coords[:, 0]
meta["pca_y"] = pca_coords[:, 1]

print(f"PCA explained variance: {pca.explained_variance_ratio_}")

plt.figure(figsize=(9, 7))
sns.scatterplot(data=meta, x="pca_x", y="pca_y", hue="cluster", palette="tab10", alpha=0.5, s=15)
plt.title(f"Student Clusters (PCA-reduced, k={best_k})")
plt.xlabel(f"PC1 ({pca.explained_variance_ratio_[0]*100:.1f}% variance)")
plt.ylabel(f"PC2 ({pca.explained_variance_ratio_[1]*100:.1f}% variance)")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUTS_DIR, "cluster_pca_visualization.png"), dpi=150)
plt.close()
print("Saved PCA cluster visualization.")

# ===== Cluster profiling =====
print("\n=== Cluster Profiles (mean feature values) ===")
profile = X_scaled.groupby("cluster")[features].mean()
print(profile)

print("\n=== Cluster outcome distribution (final_result) ===")
outcome_dist = pd.crosstab(meta["cluster"], meta["final_result"], normalize="index") * 100
print(outcome_dist.round(1))

profile.to_csv(os.path.join(OUTPUTS_DIR, "cluster_profiles.csv"))
outcome_dist.to_csv(os.path.join(OUTPUTS_DIR, "cluster_outcome_distribution.csv"))

joblib.dump(kmeans, os.path.join(MODELS_DIR, "kmeans_model.pkl"))
joblib.dump(pca, os.path.join(MODELS_DIR, "pca_model.pkl"))
meta.to_csv(os.path.join(OUTPUTS_DIR, "student_clusters.csv"), index=False)

print("\nSaved KMeans model, PCA model, and cluster assignments.")
