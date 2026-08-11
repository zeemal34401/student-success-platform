const API_BASE_URL = "http://127.0.0.1:8002";

export async function getInterventionRecommendations(studentId, topN = 5) {
  try {
    const response = await fetch(`${API_BASE_URL}/recommend/${studentId}?top_n=${topN}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Recommendation request failed");
    }

    return await response.json();
    // returns: { student_id, found, recommendations: [{ skill, student_mastery, class_average_mastery, priority_score }] }
  } catch (error) {
    console.error("Recommendation error:", error);
    throw error;
  }
}