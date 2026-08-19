import { useLocation } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";

const PAGE_TITLES = {
  "/": ["Dashboard", "Age Prediction"],
  "/predict": ["Predict Age", "Predict Age"],
};

export function Topbar() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [crumb, heading] = PAGE_TITLES[pathname] || ["Not Found", "Page Not Found"];

  return (
    <header className="topbar">
      <div>
        <span className="breadcrumb">AGE AI / {crumb}</span>
        {/* The design shows only a breadcrumb, but the page still needs a
            real heading for assistive tech. */}
        <h1 className="sr-only">{heading}</h1>
      </div>

      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      >
        <span aria-hidden="true">{theme === "light" ? "🌙" : "☀️"}</span>
      </button>
    </header>
  );
}
