import { API_BASE_URL } from "../api/client";

// Warns that predictions will fail before the user bothers choosing an image.
export function HealthNotice({ status, onRetry }) {
  if (status !== "offline" && status !== "degraded") return null;

  const offline = status === "offline";

  return (
    <div
      className={`health-notice ${offline ? "" : "health-notice-warn"}`}
      role="status"
    >
      <span className="health-notice-dot" aria-hidden="true"></span>

      {offline ? (
        <p>
          Can&apos;t reach the backend at <code>{API_BASE_URL}</code>. Start the server,
          then predictions will work.
        </p>
      ) : (
        <p>The server is up but the AI model isn&apos;t loaded yet.</p>
      )}

      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
