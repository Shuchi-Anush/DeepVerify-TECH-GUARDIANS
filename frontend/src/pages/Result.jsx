import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import Papa from "papaparse";
import { artifactUrl } from "../services/api";

export default function Result() {
  const navigate = useNavigate();
  const stored = localStorage.getItem("deepverify_result");
  const data = stored ? JSON.parse(stored) : null;

  if (!data) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "100px 20px" }}>
          <h2>No analysis data found.</h2>
          <button style={primaryButton} onClick={() => navigate("/upload")}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const timestamp = data.analyzed_at || data.blockchain?.anchored_at || "N/A";
  const txId = data.blockchain?.tx_id || "N/A";
  const ela = data.signals?.ela || {};
  const fft = data.signals?.fft || {};
  const meta = data.signals?.metadata || {};

  const riskColor =
    data.risk_label === "REAL"
      ? "#22c55e"
      : data.risk_label === "SUSPICIOUS"
        ? "#f59e0b"
        : "#ef4444";

  const aiColor =
    data.ai_label === "REAL"
      ? "#22c55e"
      : data.ai_label === "UNAVAILABLE"
        ? "#6b7280"
        : "#ef4444";

  /* ================= DOWNLOAD FUNCTIONS ================= */

  const downloadFile = async (url, filename) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const downloadArtifacts = async () => {
    if (ela.heatmap_path) {
      await downloadFile(artifactUrl(ela.heatmap_path), "ela_heatmap.png");
      await new Promise((r) => setTimeout(r, 500));
    }
    if (fft.spectrum_path) {
      await downloadFile(artifactUrl(fft.spectrum_path), "fft_spectrum.png");
    }
  };

  const downloadCSV = () => {
    const csvData = [
      {
        filename: data.filename,
        sha256: data.sha256,
        risk_score: data.risk_score,
        risk_label: data.risk_label,
        ai_score: data.ai_score,
        ai_label: data.ai_label,
        ela_score: ela.score,
        fft_score: fft.score,
        metadata_score: meta.score,
        analyzed_at: timestamp,
        blockchain_tx_id: txId,
        blockchain_anchored_at: data.blockchain?.anchored_at,
      },
    ];
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "DeepVerify_Report.csv";
    link.click();
  };
  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;

    /* ===== HEADER ===== */
    doc.setFillColor(20, 30, 60);
    doc.rect(0, 0, 210, 30, "F");

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("DeepVerify", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.text("Digital Image Forensic Analysis Report", 105, 23, {
      align: "center",
    });

    y = 40;
    doc.setTextColor(0, 0, 0);

    /* ===== SECTION TITLE FUNCTION ===== */
    const sectionTitle = (title) => {
      doc.setFillColor(230, 235, 255);
      doc.rect(15, y - 6, 180, 10, "F");

      doc.setFontSize(14);
      doc.setTextColor(20, 30, 100);
      doc.text(title, 20, y);
      y += 12;

      doc.setTextColor(0, 0, 0);
    };

    /* ===== KEY VALUE FUNCTION ===== */
    const keyValue = (key, value) => {
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text(`${key}:`, 20, y);
      doc.setFont(undefined, "normal");

      const lines = doc.splitTextToSize(value.toString(), 130);
      doc.text(lines, 70, y);
      y += lines.length * 6 + 4;
    };

    /* ============================ */
    /* 1. CASE INFORMATION */
    /* ============================ */

    sectionTitle("1. Case Information");

    keyValue("Filename", data.filename);
    keyValue("SHA-256", data.sha256);
    keyValue("Analyzed At", timestamp);
    keyValue("Blockchain TX ID", txId);

    y += 6;

    /* ============================ */
    /* 2. RISK ASSESSMENT */
    /* ============================ */

    sectionTitle("2. Risk Assessment");

    keyValue("Risk Score", `${(data.risk_score * 100).toFixed(1)}%`);

    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Risk Classification:", 20, y);

    const rc =
      data.risk_label === "REAL"
        ? [0, 150, 0]
        : data.risk_label === "SUSPICIOUS"
          ? [180, 120, 0]
          : [200, 0, 0];
    doc.setTextColor(...rc);
    doc.text(data.risk_label, 70, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, "normal");
    y += 12;

    /* ============================ */
    /* AI DETECTION */
    /* ============================ */

    sectionTitle("3. AI / Deepfake Detection");
    keyValue("AI Confidence", `${(data.ai_score * 100).toFixed(1)}%`);
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("AI Verdict:", 20, y);
    const ac =
      data.ai_label === "REAL"
        ? [0, 150, 0]
        : data.ai_label === "UNAVAILABLE"
          ? [100, 100, 100]
          : [200, 0, 0];
    doc.setTextColor(...ac);
    doc.text(data.ai_label || "UNAVAILABLE", 70, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, "normal");
    y += 12;

    /* ============================ */
    /* 3. FORENSIC ANALYSIS */
    /* ============================ */

    sectionTitle("4. Forensic Signal Analysis");

    keyValue("ELA Score", `${(ela.score * 100).toFixed(1)}%`);
    if (ela.quality_used != null)
      keyValue("ELA Quality", ela.quality_used.toString());
    if (ela.amplification_used != null)
      keyValue("ELA Amplification", ela.amplification_used.toString());
    keyValue("FFT Score", `${(fft.score * 100).toFixed(1)}%`);
    if (fft.hf_energy != null) keyValue("HF Energy", fft.hf_energy.toFixed(4));
    keyValue("Metadata Score", `${(meta.score * 100).toFixed(1)}%`);
    if (meta.flags?.length > 0) {
      keyValue("Metadata Flags", meta.flags.join(", "));
    } else {
      keyValue("Metadata Flags", "None");
    }
    y += 6;

    /* ============================ */
    /* 5. CONCLUSION */
    /* ============================ */

    sectionTitle("5. Conclusion");

    let conclusion = "";

    if (data.risk_label === "REAL") {
      conclusion =
        "The forensic signals indicate no strong evidence of digital manipulation. The image is likely authentic.";
    } else if (data.risk_label === "SUSPICIOUS") {
      conclusion =
        "Moderate forensic inconsistencies were detected. Further manual inspection is recommended.";
    } else {
      conclusion =
        "Strong forensic indicators suggest that the image has been digitally manipulated.";
    }

    const conclusionLines = doc.splitTextToSize(conclusion, 170);
    doc.text(conclusionLines, 20, y);
    y += conclusionLines.length * 6 + 10;

    /* ===== FOOTER ===== */
    doc.setDrawColor(200);
    doc.line(20, 280, 190, 280);

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      "Generated by DeepVerify | Blockchain-Anchored Digital Forensics Engine",
      105,
      287,
      { align: "center" },
    );

    doc.save("DeepVerify_Forensic_Report.pdf");
  };
  /* ================= UI ================= */

  return (
    <div style={containerStyle}>
      <div style={navbar}>
        <h2 style={{ color: "#00f2fe" }}>DeepVerify</h2>
        <div style={navButtons}>
          <button style={actionButton} onClick={downloadCSV}>
            CSV
          </button>
          <button style={actionButton} onClick={downloadPDF}>
            PDF
          </button>
          <button style={actionButton} onClick={downloadArtifacts}>
            Artifacts
          </button>
          <button style={navButton} onClick={() => navigate("/history")}>
            History
          </button>
          <button style={navButton} onClick={() => navigate("/verify")}>
            Verify
          </button>
          <button style={secondaryButton} onClick={() => navigate("/upload")}>
            New Analysis
          </button>
        </div>
      </div>

      {/* Risk + AI Banner */}
      <div style={{ ...riskCard, borderColor: riskColor }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "30px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: "12px", opacity: 0.6, marginBottom: "4px" }}
            >
              FORENSIC VERDICT
            </div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", color: riskColor }}
            >
              {data.risk_label}
            </div>
            <div style={{ fontSize: "14px", opacity: 0.7, marginTop: "4px" }}>
              Risk Score: <strong>{(data.risk_score * 100).toFixed(1)}%</strong>
            </div>
          </div>
          <div
            style={{ width: "1px", height: "60px", background: "#374151" }}
          />
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: "12px", opacity: 0.6, marginBottom: "4px" }}
            >
              AI DETECTION
            </div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", color: aiColor }}
            >
              {data.ai_label || "UNAVAILABLE"}
            </div>
            <div style={{ fontSize: "14px", opacity: 0.7, marginTop: "4px" }}>
              AI Confidence:{" "}
              <strong>{(data.ai_score * 100).toFixed(1)}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* File Info Grid */}
      <div style={gridContainer}>
        <div style={infoBox}>
          <h4 style={boxLabel}>Filename</h4>
          <p style={{ wordBreak: "break-all" }}>{data.filename}</p>
        </div>
        <div style={infoBox}>
          <h4 style={boxLabel}>SHA-256</h4>
          <p style={shaStyle}>{data.sha256}</p>
        </div>
        <div style={infoBox}>
          <h4 style={boxLabel}>Analyzed At</h4>
          <p>
            {timestamp !== "N/A" ? new Date(timestamp).toLocaleString() : "N/A"}
          </p>
        </div>
        <div style={infoBox}>
          <h4 style={boxLabel}>Blockchain TX ID</h4>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "12px",
              wordBreak: "break-all",
            }}
          >
            {txId}
          </p>
        </div>
      </div>

      {/* Signal Cards */}
      <div style={sectionHeader}>Forensic Signal Breakdown</div>
      <div style={signalContainer}>
        <div style={signalCard}>
          <h3 style={{ color: "#4facfe" }}>ELA</h3>
          <div style={scoreCircleStyle(ela.score || 0)}>
            {((ela.score || 0) * 100).toFixed(1)}%
          </div>
          <p style={signalDetail}>Quality: {ela.quality_used ?? "N/A"}</p>
          <p style={signalDetail}>
            Amplification: {ela.amplification_used ?? "N/A"}
          </p>
          {ela.error && (
            <p style={{ color: "#f87171", fontSize: "11px" }}>{ela.error}</p>
          )}
        </div>
        <div style={signalCard}>
          <h3 style={{ color: "#4facfe" }}>FFT</h3>
          <div style={scoreCircleStyle(fft.score || 0)}>
            {((fft.score || 0) * 100).toFixed(1)}%
          </div>
          <p style={signalDetail}>
            HF Energy:{" "}
            {fft.hf_energy != null ? fft.hf_energy.toFixed(4) : "N/A"}
          </p>
          {fft.error && (
            <p style={{ color: "#f87171", fontSize: "11px" }}>{fft.error}</p>
          )}
        </div>
        <div style={signalCard}>
          <h3 style={{ color: "#4facfe" }}>Metadata</h3>
          <div style={scoreCircleStyle(meta.score || 0)}>
            {((meta.score || 0) * 100).toFixed(1)}%
          </div>
          {meta.flags?.length > 0 ? (
            meta.flags.map((f, i) => (
              <p key={i} style={{ ...signalDetail, color: "#fbbf24" }}>
                ⚑ {f}
              </p>
            ))
          ) : (
            <p style={{ ...signalDetail, color: "#22c55e" }}>✓ No flags</p>
          )}
        </div>
        <div style={signalCard}>
          <h3 style={{ color: "#a78bfa" }}>AI Detector</h3>
          <div style={scoreCircleStyle(data.ai_score || 0)}>
            {((data.ai_score || 0) * 100).toFixed(1)}%
          </div>
          <p style={{ ...signalDetail, color: aiColor, fontWeight: "bold" }}>
            {data.ai_label || "UNAVAILABLE"}
          </p>
        </div>
      </div>

      {/* Artifact Images */}
      <div style={sectionHeader}>Forensic Artifacts</div>
      <div style={artifactSection}>
        {ela.heatmap_path ? (
          <div style={artifactBox}>
            <h3 style={{ color: "#4facfe", marginBottom: "12px" }}>
              ELA Heatmap
            </h3>
            <img
              src={artifactUrl(ela.heatmap_path)}
              alt="ELA Heatmap"
              style={imageStyle}
            />
          </div>
        ) : (
          <div style={artifactBox}>
            <h3 style={{ color: "#6b7280" }}>ELA Heatmap — not available</h3>
          </div>
        )}
        {fft.spectrum_path ? (
          <div style={artifactBox}>
            <h3 style={{ color: "#4facfe", marginBottom: "12px" }}>
              FFT Spectrum
            </h3>
            <img
              src={artifactUrl(fft.spectrum_path)}
              alt="FFT Spectrum"
              style={imageStyle}
            />
          </div>
        ) : (
          <div style={artifactBox}>
            <h3 style={{ color: "#6b7280" }}>FFT Spectrum — not available</h3>
          </div>
        )}
      </div>
      <div style={{ height: "60px" }} />
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
  flexWrap: "wrap",
  gap: "10px",
};

const navButtons = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const riskCard = {
  margin: "30px auto",
  padding: "30px 40px",
  background: "linear-gradient(135deg,#141e30,#243b55)",
  borderRadius: "16px",
  width: "fit-content",
  border: "2px solid transparent",
};

const gridContainer = {
  display: "flex",
  justifyContent: "center",
  gap: "20px",
  flexWrap: "wrap",
  padding: "0 40px",
};

const infoBox = {
  background: "#111827",
  padding: "20px",
  borderRadius: "10px",
  flex: "1 1 220px",
  maxWidth: "300px",
};

const boxLabel = {
  color: "#9ca3af",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "8px",
};

const sectionHeader = {
  textAlign: "center",
  fontSize: "18px",
  fontWeight: "bold",
  color: "#9ca3af",
  margin: "40px 0 20px",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const signalContainer = {
  display: "flex",
  justifyContent: "center",
  gap: "20px",
  flexWrap: "wrap",
  padding: "0 40px",
};

const signalCard = {
  background: "#111827",
  padding: "24px 20px",
  borderRadius: "12px",
  flex: "1 1 160px",
  maxWidth: "220px",
  textAlign: "center",
};

const scoreCircleStyle = (score) => ({
  width: "72px",
  height: "72px",
  borderRadius: "50%",
  margin: "12px auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
  fontSize: "15px",
  border: `3px solid ${score < 0.3 ? "#22c55e" : score < 0.6 ? "#f59e0b" : "#ef4444"}`,
  color: score < 0.3 ? "#22c55e" : score < 0.6 ? "#f59e0b" : "#ef4444",
  background: "#0f172a",
});

const signalDetail = {
  fontSize: "12px",
  opacity: 0.7,
  margin: "4px 0",
};

const artifactSection = {
  display: "flex",
  justifyContent: "center",
  gap: "40px",
  flexWrap: "wrap",
  padding: "0 40px",
  marginTop: "10px",
};

const artifactBox = {
  background: "#111827",
  padding: "24px",
  borderRadius: "12px",
  textAlign: "center",
};

const imageStyle = {
  width: "380px",
  maxWidth: "100%",
  borderRadius: "10px",
};

const primaryButton = {
  padding: "10px 20px",
  background: "linear-gradient(90deg,#00f2fe,#4facfe)",
  border: "none",
  color: "black",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const actionButton = {
  padding: "8px 14px",
  background: "linear-gradient(90deg,#00f2fe,#4facfe)",
  border: "none",
  color: "black",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "13px",
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

const shaStyle = {
  fontSize: "11px",
  wordBreak: "break-all",
  fontFamily: "monospace",
  opacity: 0.8,
};
