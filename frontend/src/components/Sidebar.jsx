import { NavLink } from "react-router-dom";
import { API_BASE_URL } from "../api/client";
import { usePrediction } from "../context/usePrediction";
import { HEALTH_LABELS } from "../hooks/useBackendHealth";

const NAV_ITEMS = [
  { to: "/", icon: "⌂", label: "Dashboard", end: true },
  { to: "/predict", icon: "◉", label: "Predict Age" },
];

export function Sidebar() {
  const { health, recheckHealth } = usePrediction();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          AI
        </div>

        <div>
          <h2>AGE AI</h2>
          <span>Age Intelligence</span>
        </div>
      </div>

      <nav className="sidebar-section" aria-label="Main">
        <p className="section-label">MENU</p>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          type="button"
          className={`ai-status ai-status-${health.status}`}
          onClick={recheckHealth}
          title={`Backend: ${API_BASE_URL} — click to re-check`}
        >
          <span className="status-dot" aria-hidden="true"></span>

          <span className="ai-status-text">
            <strong>{HEALTH_LABELS[health.status]}</strong>
            <span>{health.detail}</span>
          </span>
        </button>
      </div>
    </aside>
  );
}
