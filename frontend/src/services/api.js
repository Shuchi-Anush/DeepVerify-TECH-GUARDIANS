import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

const API = axios.create({
  baseURL: BASE_URL,
});

// ── Health ────────────────────────────────────────────────────
export const getHealth = () => API.get("/health");

// ── Forensic Analysis ─────────────────────────────────────────
/** POST /analyze — multipart/form-data with a `file` field */
export const analyzeImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ── Blockchain Verify ─────────────────────────────────────────
/** POST /verify — body: { sha256: string } */
export const verifyHash = (sha256) => API.post("/verify", { sha256 });

// ── History ───────────────────────────────────────────────────
/** GET /history — returns { total, items: HistoryItem[] } */
export const getHistory = () => API.get("/history");

/** GET /report/{sha256} — returns full AnalysisResponse */
export const getReport = (sha256) => API.get(`/report/${sha256}`);

// ── Stats ─────────────────────────────────────────────────────
/** GET /stats — returns { total_analyzed, by_risk_label, by_ai_label, average_risk_score } */
export const getStats = () => API.get("/stats");

// ── Artifact helper ───────────────────────────────────────────
/** Convert a relative artifact path (e.g. /artifacts/.../ela_heatmap.png) to a full URL */
export const artifactUrl = (relativePath) =>
  relativePath ? `${BASE_URL}${relativePath}` : null;

export default API;
