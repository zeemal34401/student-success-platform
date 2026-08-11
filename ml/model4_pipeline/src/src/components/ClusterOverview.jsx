import { useEffect, useState } from "react";
import { getClusterSummary } from "../services/clusterApi";

function ClusterOverview() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getClusterSummary()
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!summary) return <p>Loading cluster overview...</p>;

  return (
    <div className="cluster-overview">
      <h3>Student Population Overview ({summary.total_students} students)</h3>
      {summary.clusters.map((c) => (
        <div key={c.cluster_id} className="cluster-card">
          <h4>{c.label}</h4>
          <p>{c.student_count} students ({c.percentage}%)</p>
          <p>
            Pass: {c.outcome_distribution.Pass?.toFixed(1)}% |{" "}
            Distinction: {c.outcome_distribution.Distinction?.toFixed(1)}% |{" "}
            Fail: {c.outcome_distribution.Fail?.toFixed(1)}% |{" "}
            Withdrawn: {c.outcome_distribution.Withdrawn?.toFixed(1)}%
          </p>
        </div>
      ))}
    </div>
  );
}

export default ClusterOverview;