const API_BASE_URL = "http://127.0.0.1:8003";

export async function getClusterSummary() {
  const response = await fetch(`${API_BASE_URL}/cluster/summary`);
  if (!response.ok) throw new Error("Failed to fetch cluster summary");
  return await response.json();
}

export async function getStudentCluster(idStudent) {
  const response = await fetch(`${API_BASE_URL}/cluster/student/${idStudent}`);
  if (!response.ok) throw new Error("Student not found in cluster data");
  return await response.json();
}

export async function classifyStudent(features) {
  const response = await fetch(`${API_BASE_URL}/cluster/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(features),
  });
  if (!response.ok) throw new Error("Classification failed");
  return await response.json();
}