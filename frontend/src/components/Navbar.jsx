import { useNavigate, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { label: "Analyze", path: "/upload" },
  { label: "History", path: "/history" },
  { label: "Verify", path: "/verify" },
  { label: "Stats", path: "/stats" },
];

function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav style={navStyle}>
      <span style={logoStyle} onClick={() => navigate("/")} role="button">
        DeepVerify
      </span>
      <div style={linksStyle}>
        {NAV_LINKS.map(({ label, path }) => (
          <button
            key={path}
            style={pathname === path ? activeLinkBtn : linkBtn}
            onClick={() => navigate(path)}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;

/* ================= STYLES ================= */

const navStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 40px",
  borderBottom: "1px solid #1f2937",
  background: "#0b0f19",
  position: "sticky",
  top: 0,
  zIndex: 100,
};

const logoStyle = {
  color: "#00f2fe",
  fontSize: "20px",
  fontWeight: "bold",
  cursor: "pointer",
  userSelect: "none",
};

const linksStyle = {
  display: "flex",
  gap: "10px",
};

const linkBtn = {
  padding: "8px 16px",
  background: "transparent",
  border: "1px solid #374151",
  color: "#9ca3af",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
};

const activeLinkBtn = {
  ...linkBtn,
  background: "linear-gradient(90deg,#00f2fe,#4facfe)",
  border: "none",
  color: "black",
  fontWeight: "bold",
};
