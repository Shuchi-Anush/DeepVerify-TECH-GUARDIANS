import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory } from "../services/api";

export default function History() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getHistory()
      .then((res) => {
        setItems(res.data.items);
        setTotal(res.data.total);
      })
      .catch((err) => {
        setError("Failed to load history from the backend.");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleViewReport = async (sha256) => {
    // Import lazily to avoid circular deps
    const { getReport } = await import("../services/api");
    try {
      const res = await getReport(sha256);
      localStorage.setItem("deepverify_result", JSON.stringify(res.data));
      navigate("/result");
    } catch (e) {
      alert("Could not load that report.");
      console.error(e);
    }
  };

  const riskColor = (label) =>
    label === "REAL"
      ? "#22c55e"
      : label === "SUSPICIOUS"
        ? "#f59e0b"
        : "#ef4444";

  const aiColor = (label) =>
    label === "REAL"
      ? "#22c55e"
      : label === "UNAVAILABLE"
        ? "#6b7280"
        : "#ef4444";

  return (
    <div style={containerStyle}>
      {/* Navbar */}
      <div style={navbar}>
        <h2 style={{ color: "#00f2fe" }}>DeepVerify</h2>
        <div style={{ display: "flex", gap: "12px" }}>
          <button style={navButton} onClick={() => navigate("/upload")}>
            New Analysis
          </button>
          <button style={navButton} onClick={() => navigate("/verify")}>
            Verify Hash
          </button>
          <button style={navButton} onClick={() => navigate("/stats")}>
            Stats
          </button>
          <button style={secondaryButton} onClick={() => navigate("/")}>
            Home
          </button>
        </div>
      </div>

      {/* Header */}
      <div style={heroSection}>
        <h1 style={heroTitle}>Analysis History</h1>
        <p style={{ opacity: 0.6 }}>
          {loading
            ? "Loading..."
            : `${total} image${total !== 1 ? "s" : ""} analyzed this session`}
        </p>
      </div>

      {/* Content */}
      <div style={tableWrapper}>
        {error && (
          <p style={{ color: "#f87171", textAlign: "center" }}>{error}</p>
        )}

        {!loading && !error && items.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", opacity: 0.5 }}>
            <p style={{ fontSize: "18px" }}>No analyses yet.</p>
            <button style={primaryButton} onClick={() => navigate("/upload")}>
              Analyze an Image
            </button>
          </div>
        )}

        {items.length > 0 && (
          <table style={tableStyle}>
            <thead>
              <tr>
                {[
                  "Filename",
                  "Risk",
                  "Risk Score",
                  "AI Verdict",
                  "AI Score",
                  "Analyzed At",
                  "",
                ].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.sha256} style={trStyle}>
                  <td style={tdStyle}>
                    <span title={item.sha256} style={{ cursor: "help" }}>
                      {item.filename}
                    </span>
                    <div
                      style={{
                        fontSize: "10px",
                        opacity: 0.4,
                        fontFamily: "monospace",
                        marginTop: "2px",
                      }}
                    >
                      {item.sha256.slice(0, 16)}…
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        color: riskColor(item.risk_label),
                        fontWeight: "bold",
                      }}
                    >
                      {item.risk_label}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    {(item.risk_score * 100).toFixed(1)}%
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        color: aiColor(item.ai_label),
                        fontWeight: "bold",
                      }}
                    >
                      {item.ai_label}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    {(item.ai_score * 100).toFixed(1)}%
                  </td>
                  <td style={{ ...tdStyle, fontSize: "12px", opacity: 0.7 }}>
                    {new Date(item.analyzed_at).toLocaleString()}
                  </td>
                  <td style={tdStyle}>
                    <button
                      style={viewButton}
                      onClick={() => handleViewReport(item.sha256)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const containerStyle = {
  background: "#0b0f19",
  minHeight: "100vh",
  color: "white",
};

const navbar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 40px",
  borderBottom: "1px solid #1f2937",
};

const heroSection = {
  textAlign: "center",
  padding: "50px 20px 20px",
};

const heroTitle = {
  fontSize: "32px",
  marginBottom: "8px",
  background: "linear-gradient(90deg,#00f2fe,#4facfe)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const tableWrapper = {
  maxWidth: "1100px",
  margin: "30px auto",
  padding: "0 20px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#111827",
  borderRadius: "12px",
  overflow: "hidden",
};

const thStyle = {
  padding: "14px 16px",
  textAlign: "left",
  background: "#1f2937",
  color: "#9ca3af",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const trStyle = {
  borderBottom: "1px solid #1f2937",
};

const tdStyle = {
  padding: "14px 16px",
  fontSize: "14px",
};

const primaryButton = {
  marginTop: "16px",
  padding: "10px 20px",
  background: "linear-gradient(90deg,#00f2fe,#4facfe)",
  border: "none",
  color: "black",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const viewButton = {
  padding: "6px 14px",
  background: "linear-gradient(90deg,#00f2fe,#4facfe)",
  border: "none",
  color: "black",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "12px",
};

const secondaryButton = {
  padding: "8px 16px",
  background: "transparent",
  border: "1px solid #00f2fe",
  color: "#00f2fe",
  borderRadius: "8px",
  cursor: "pointer",
};

const navButton = {
  padding: "8px 14px",
  background: "transparent",
  border: "1px solid #374151",
  color: "#9ca3af",
  borderRadius: "8px",
  cursor: "pointer",
};
