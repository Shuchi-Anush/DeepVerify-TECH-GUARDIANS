import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyHash, getReport } from "../services/api";

export default function Verify() {
  const navigate = useNavigate();
  const [sha256, setSha256] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    const trimmed = sha256.trim();
    if (trimmed.length !== 64) {
      setError("A valid SHA-256 hash must be exactly 64 hex characters.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const res = await verifyHash(trimmed);
      setResult(res.data);
    } catch (err) {
      if (err?.response?.status === 404) {
        setError("Hash not found on the blockchain ledger.");
      } else {
        setError(
          "Verification request failed. Check if the backend is running.",
        );
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async () => {
    if (!result?.sha256) return;
    try {
      const res = await getReport(result.sha256);
      localStorage.setItem("deepverify_result", JSON.stringify(res.data));
      navigate("/result");
    } catch {
      alert(
        "Full report not available — the file may have been analysed in a different session.",
      );
    }
  };

  const record = result?.record;
  const meta = record?.metadata || {};

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
          <button style={navButton} onClick={() => navigate("/stats")}>
            Stats
          </button>
          <button style={secondaryButton} onClick={() => navigate("/")}>
            Home
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={heroSection}>
        <h1 style={heroTitle}>Blockchain Hash Verification</h1>
        <p style={{ opacity: 0.6 }}>
          Enter a SHA-256 hash to check if it has been anchored on the ledger.
        </p>
      </div>

      {/* Input Card */}
      <div style={cardStyle}>
        <input
          type="text"
          placeholder="Enter SHA-256 hash (64 hex characters)"
          value={sha256}
          onChange={(e) => {
            setSha256(e.target.value);
            setError(null);
            setResult(null);
          }}
          style={inputStyle}
          maxLength={64}
          spellCheck={false}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            opacity: 0.4,
          }}
        >
          <span>{sha256.trim().length}/64</span>
          <span>
            {sha256.trim().length === 64
              ? "✓ correct length"
              : "needs 64 chars"}
          </span>
        </div>
        <button
          style={loading ? disabledButton : primaryButton}
          onClick={handleVerify}
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify on Ledger"}
        </button>

        {error && (
          <div style={errorBox}>
            <span style={{ fontSize: "20px" }}>✗</span>
            <p>{error}</p>
          </div>
        )}

        {result?.found && record && (
          <div style={successBox}>
            <div style={{ fontSize: "20px", marginBottom: "8px" }}>
              ✓ Hash found on ledger
            </div>

            <div style={recordGrid}>
              <div style={recordField}>
                <span style={fieldLabel}>TX ID</span>
                <span style={fieldValue}>{record.tx_id}</span>
              </div>
              <div style={recordField}>
                <span style={fieldLabel}>SHA-256</span>
                <span
                  style={{
                    ...fieldValue,
                    fontSize: "11px",
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                  }}
                >
                  {record.sha256}
                </span>
              </div>
              <div style={recordField}>
                <span style={fieldLabel}>Filename</span>
                <span style={fieldValue}>{meta.filename || "N/A"}</span>
              </div>
              <div style={recordField}>
                <span style={fieldLabel}>Risk Score</span>
                <span style={fieldValue}>
                  {meta.risk_score != null
                    ? `${(meta.risk_score * 100).toFixed(1)}%`
                    : "N/A"}
                </span>
              </div>
              <div style={recordField}>
                <span style={fieldLabel}>Risk Label</span>
                <span
                  style={{
                    ...fieldValue,
                    color:
                      meta.risk_label === "REAL"
                        ? "#22c55e"
                        : meta.risk_label === "SUSPICIOUS"
                          ? "#f59e0b"
                          : "#ef4444",
                    fontWeight: "bold",
                  }}
                >
                  {meta.risk_label || "N/A"}
                </span>
              </div>
              <div style={recordField}>
                <span style={fieldLabel}>Anchored At</span>
                <span style={fieldValue}>
                  {new Date(record.anchored_at).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              style={{ ...primaryButton, marginTop: "16px" }}
              onClick={handleViewReport}
            >
              View Full Report
            </button>
          </div>
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
  display: "flex",
  flexDirection: "column",
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
  padding: "50px 20px 10px",
};

const heroTitle = {
  fontSize: "32px",
  marginBottom: "8px",
  background: "linear-gradient(90deg,#00f2fe,#4facfe)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const cardStyle = {
  margin: "30px auto",
  background: "#111827",
  padding: "40px",
  borderRadius: "16px",
  width: "540px",
  maxWidth: "90%",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  boxShadow: "0 15px 40px rgba(0,0,0,0.6)",
};

const inputStyle = {
  padding: "14px",
  borderRadius: "8px",
  border: "1px solid #374151",
  background: "#0f172a",
  color: "white",
  outline: "none",
  fontSize: "13px",
  fontFamily: "monospace",
  letterSpacing: "0.04em",
};

const primaryButton = {
  padding: "12px",
  background: "linear-gradient(90deg,#00f2fe,#4facfe)",
  border: "none",
  borderRadius: "10px",
  fontWeight: "bold",
  color: "black",
  cursor: "pointer",
  fontSize: "15px",
};

const disabledButton = {
  ...primaryButton,
  opacity: 0.6,
  cursor: "not-allowed",
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

const errorBox = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  background: "rgba(239,68,68,0.1)",
  border: "1px solid #ef4444",
  borderRadius: "10px",
  padding: "16px",
  color: "#f87171",
};

const successBox = {
  background: "rgba(34,197,94,0.07)",
  border: "1px solid #22c55e",
  borderRadius: "10px",
  padding: "20px",
  color: "#86efac",
};

const recordGrid = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  marginTop: "12px",
};

const recordField = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const fieldLabel = {
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#6b7280",
};

const fieldValue = {
  fontSize: "14px",
  color: "white",
};
