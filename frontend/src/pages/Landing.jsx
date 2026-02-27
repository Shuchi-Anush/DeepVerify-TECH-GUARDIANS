import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <div className="card" style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>
          DeepVerify
        </h1>
        <p>AI-Powered Image Forensic & Tamper Detection System</p>
        <br />
        <button onClick={() => navigate("/auth")}>Next</button>
      </div>
    </div>
  );
}

export default Landing;