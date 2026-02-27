import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  // ✅ State to store input values
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Client-side only auth — backend has no auth endpoints yet
  const handleSubmit = () => {
    if (!email || !password) {
      alert("Please fill all required fields!");
      return;
    }

    if (!isLogin && !confirmPassword) {
      alert("Please confirm your password!");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Store minimal session info locally and proceed
    sessionStorage.setItem("dv_user", email);
    navigate("/upload");
  };

  return (
    <div style={containerStyle}>
      {/* Navbar */}
      <div style={navbar}>
        <h2 style={logoStyle}>DeepVerify</h2>
      </div>

      {/* Auth Card */}
      <div style={cardStyle}>
        <h1 style={titleStyle}>
          {isLogin ? "Secure Login" : "Create Account"}
        </h1>

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {!isLogin && (
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />
        )}

        <button style={primaryButton} onClick={handleSubmit}>
          {isLogin ? "Login" : "Register"}
        </button>

        <p style={toggleText}>
          {isLogin ? "No account?" : "Already have an account?"}
          <span style={toggleLink} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? " Register" : " Login"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Auth;

/* ================= STYLES ================= */
const containerStyle = {
  background: "#0b0f19",
  minHeight: "100vh",
  color: "white",
  display: "flex",
  flexDirection: "column",
};

const navbar = {
  padding: "20px 40px",
  borderBottom: "1px solid #1f2937",
};

const logoStyle = {
  color: "#00f2fe",
};

const cardStyle = {
  margin: "100px auto",
  background: "rgba(17,24,39,0.8)",
  backdropFilter: "blur(10px)",
  padding: "40px",
  borderRadius: "16px",
  width: "380px",
  display: "flex",
  flexDirection: "column",
  gap: "18px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
  textAlign: "center",
};

const titleStyle = {
  marginBottom: "10px",
  background: "linear-gradient(90deg,#00f2fe,#4facfe)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const inputStyle = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #374151",
  background: "#0f172a",
  color: "white",
  outline: "none",
  fontSize: "14px",
};

const primaryButton = {
  padding: "12px",
  background: "linear-gradient(90deg,#00f2fe,#4facfe)",
  border: "none",
  borderRadius: "10px",
  fontWeight: "bold",
  color: "black",
  cursor: "pointer",
  marginTop: "10px",
};

const toggleText = {
  marginTop: "10px",
  fontSize: "14px",
  opacity: 0.8,
};

const toggleLink = {
  color: "#00f2fe",
  cursor: "pointer",
  fontWeight: "bold",
};
