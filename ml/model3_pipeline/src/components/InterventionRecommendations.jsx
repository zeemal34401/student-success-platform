import { useState } from "react";
import { getInterventionRecommendations } from "../services/recommenderApi";

function InterventionRecommendations({ studentId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getInterventionRecommendations(studentId);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="intervention-panel">
      <button onClick={fetchRecommendations} disabled={loading}>
        {loading ? "Loading..." : "Get Recommended Interventions"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {data && data.found && (
        <ul>
          {data.recommendations.map((r, i) => (
            <li key={i}>
              <strong>{r.skill}</strong> — mastery {Math.round(r.student_mastery * 100)}%
              (class avg {Math.round(r.class_average_mastery * 100)}%)
            </li>
          ))}
        </ul>
      )}

      {data && !data.found && <p>No data available for this student in the current model.</p>}
    </div>
  );
}

export default InterventionRecommendations;