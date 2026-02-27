import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeImage } from "../services/api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    setPreview(URL.createObjectURL(selected));
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await analyzeImage(file);
      localStorage.setItem("deepverify_result", JSON.stringify(response.data));
      navigate("/result");
    } catch (err) {
      const detail =
        err?.response?.data?.detail || "Analysis failed. Please try again.";
      setError(detail);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Navbar */}
      <div style={navbar}>
        <h2 style={logoStyle}>DeepVerify</h2>
        <div style={{ display: "flex", gap: "12px" }}>
          <button style={navButton} onClick={() => navigate("/history")}>
            History
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

      {/* Hero */}
      <div style={heroSection}>
        <h1 style={heroTitle}>Digital Image Forensic Analysis</h1>
        <p style={heroSubtitle}>
          Upload an image to detect tampering using AI-based forensic signals
          and blockchain anchoring.
        </p>
      </div>

      {/* Upload Card */}
      <div style={cardStyle}>
        <label style={uploadBox}>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.tiff,.tif"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          {preview ? (
            <img src={preview} alt="preview" style={previewImg} />
          ) : (
            <>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>📂</div>
              <p style={{ opacity: 0.7 }}>Click to select an image</p>
              <p style={{ fontSize: "12px", opacity: 0.4 }}>
                JPG, JPEG, PNG, TIFF — max 50 MB
              </p>
            </>
          )}
        </label>

        {file && (
          <p style={{ fontSize: "13px", opacity: 0.7, textAlign: "center" }}>
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}

        {error && (
          <p
            style={{ color: "#f87171", fontSize: "13px", textAlign: "center" }}
          >
            ⚠ {error}
          </p>
        )}

        <button
          style={loading ? disabledButton : primaryButton}
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? "Analyzing Image..." : "Analyze File"}
        </button>
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
  padding: "20px 40px",
  borderBottom: "1px solid #1f2937",
};

const logoStyle = { color: "#00f2fe" };

const heroSection = { textAlign: "center", marginTop: "60px" };

const heroTitle = {
  fontSize: "36px",
  marginBottom: "10px",
  background: "linear-gradient(90deg,#00f2fe,#4facfe)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const heroSubtitle = { fontSize: "16px", opacity: 0.7 };

const cardStyle = {
  margin: "40px auto",
  background: "#111827",
  padding: "40px",
  borderRadius: "16px",
  width: "440px",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  boxShadow: "0 15px 40px rgba(0,0,0,0.6)",
};

const uploadBox = {
  border: "2px dashed #374151",
  padding: "30px",
  borderRadius: "12px",
  background: "#0f172a",
  cursor: "pointer",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  minHeight: "160px",
  justifyContent: "center",
};

const previewImg = {
  maxWidth: "100%",
  maxHeight: "200px",
  borderRadius: "8px",
  objectFit: "contain",
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
  padding: "8px 18px",
  background: "transparent",
  border: "1px solid #00f2fe",
  color: "#00f2fe",
  borderRadius: "8px",
  cursor: "pointer",
};

const navButton = {
  padding: "8px 16px",
  background: "transparent",
  border: "1px solid #374151",
  color: "#9ca3af",
  borderRadius: "8px",
  cursor: "pointer",
};
