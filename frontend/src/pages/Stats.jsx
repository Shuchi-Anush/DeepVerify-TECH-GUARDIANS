import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStats } from "../services/api";

export default function Stats() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStats()
      .then((res) => setStats(res.data))
      .catch((err) => {
        setError("Failed to load stats from the backend.");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const riskColors = {
    REAL: "#22c55e",
    SUSPICIOUS: "#f59e0b",
    TAMPERED: "#ef4444",
    INCONCLUSIVE: "#6b7280",
  };

  const aiColors = {
    REAL: "#22c55e",
    AI_GENERATED: "#ef4444",
    UNAVAILABLE: "#6b7280",
  };

  return (
    <div style={containerStyle}>
      {/* Navbar */}
      <div style={navbar}>
        <h2 style={{ color: "#00f2fe" }}>DeepVerify</h2>
        <div style={{ display: "flex", gap: "12px" }}>
          <button style={navButton} onClick={() => navigate("/upload")}>
            New Analysis
          </button>
          <button style={navButton} onClick={() => navigate("/history")}>
            History
          </button>
          <button style={navButton} onClick={() => navigate("/verify")}>
            Verify Hash
          </button>
          <button style={secondaryButton} onClick={() => navigate("/")}>
            Home
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={heroSection}>
        <h1 style={heroTitle}>Session Statistics</h1>
        <p style={{ opacity: 0.6 }}>
          Aggregate data for all analyses performed in the current server
          session.
        </p>
      </div>

      {loading && (
        <p style={{ textAlign: "center", opacity: 0.5 }}>Loading stats…</p>
      )}
      {error && (
        <p style={{ color: "#f87171", textAlign: "center" }}>{error}</p>
      )}

      {stats && (
        <div style={dashGrid}>
          {/* Total Analyzed */}
          <div
            style={{ ...statCard, gridColumn: "1 / -1", textAlign: "center" }}
          >
            <div style={statLabel}>Total Images Analyzed</div>
            <div style={bigNumber}>{stats.total_analyzed}</div>
            <div style={{ opacity: 0.5, fontSize: "14px", marginTop: "4px" }}>
              Average Risk Score:{" "}
              <strong style={{ color: "#4facfe" }}>
                {(stats.average_risk_score * 100).toFixed(1)}%
              </strong>
            </div>
          </div>

          {/* Risk Label Breakdown */}
          <div style={statCard}>
            <div style={cardTitle}>Risk Label Breakdown</div>
            {Object.entries(stats.by_risk_label).length === 0 ? (
              <p style={{ opacity: 0.4, fontSize: "13px" }}>No data yet</p>
            ) : (
              Object.entries(stats.by_risk_label).map(([label, count]) => (
                <div key={label} style={barRow}>
                  <span
                    style={{
                      color: riskColors[label] || "#9ca3af",
                      minWidth: "110px",
                      fontWeight: "bold",
                    }}
                  >
                    {label}
                  </span>
                  <div style={barTrack}>
                    <div
                      style={{
                        ...barFill,
                        width: stats.total_analyzed
                          ? `${(count / stats.total_analyzed) * 100}%`
                          : "0%",
                        background: riskColors[label] || "#9ca3af",
                      }}
                    />
                  </div>
                  <span style={barCount}>{count}</span>
                </div>
              ))
            )}
          </div>

          {/* AI Label Breakdown */}
          <div style={statCard}>
            <div style={cardTitle}>AI Detection Breakdown</div>
            {Object.entries(stats.by_ai_label).length === 0 ? (
              <p style={{ opacity: 0.4, fontSize: "13px" }}>No data yet</p>
            ) : (
              Object.entries(stats.by_ai_label).map(([label, count]) => (
                <div key={label} style={barRow}>
                  <span
                    style={{
                      color: aiColors[label] || "#9ca3af",
                      minWidth: "130px",
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    {label}
                  </span>
                  <div style={barTrack}>
                    <div
                      style={{
                        ...barFill,
                        width: stats.total_analyzed
                          ? `${(count / stats.total_analyzed) * 100}%`
                          : "0%",
                        background: aiColors[label] || "#9ca3af",
                      }}
                    />
                  </div>
                  <span style={barCount}>{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {stats?.total_analyzed === 0 && (
        <div style={{ textAlign: "center", padding: "40px", opacity: 0.5 }}>
          <p>No images have been analyzed yet in this session.</p>
          <button style={primaryButton} onClick={() => navigate("/upload")}>
            Analyze an Image
          </button>
        </div>
      )}
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

const dashGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "24px",
  maxWidth: "900px",
  margin: "30px auto",
  padding: "0 20px",
};

const statCard = {
  background: "#111827",
  padding: "28px",
  borderRadius: "14px",
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const statLabel = {
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#6b7280",
};

const bigNumber = {
  fontSize: "64px",
  fontWeight: "bold",
  background: "linear-gradient(90deg,#00f2fe,#4facfe)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  lineHeight: 1,
};

const cardTitle = {
  fontSize: "15px",
  fontWeight: "bold",
  color: "#9ca3af",
  borderBottom: "1px solid #1f2937",
  paddingBottom: "10px",
};

const barRow = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const barTrack = {
  flex: 1,
  height: "8px",
  background: "#1f2937",
  borderRadius: "4px",
  overflow: "hidden",
};

const barFill = {
  height: "100%",
  borderRadius: "4px",
  transition: "width 0.5s ease",
};

const barCount = {
  minWidth: "24px",
  textAlign: "right",
  fontSize: "13px",
  opacity: 0.8,
};

const primaryButton = {
  marginTop: "12px",
  padding: "10px 20px",
  background: "linear-gradient(90deg,#00f2fe,#4facfe)",
  border: "none",
  color: "black",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
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
