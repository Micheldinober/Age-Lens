import { useCallback, useEffect, useRef, useState } from "react";
import { fetchHealth } from "../api/client";

export const HEALTH_LABELS = {
  checking: "Checking…",
  online: "AI System",
  degraded: "AI System",
  offline: "Backend Offline",
};

const HEALTH_POLL_MS = 30000;
const HEALTH_TIMEOUT_MS = 5000;

// The endpoint reports whether the models are loaded. This backend answers
// {"status":"ok","models_loaded":3} — a count — but a boolean flag is just as
// common, so accept both. Only an explicit negative counts as degraded; an
// absent field simply means "not reported".
function readModelReady(body) {
  const count = body?.models_loaded ?? body?.modelsLoaded;
  if (typeof count === "number") return count > 0;

  const flag = body?.model_loaded ?? body?.modelLoaded ?? body?.model_ready;
  if (typeof flag === "boolean") return flag;

  const status = String(body?.status ?? body?.state ?? "");
  if (/degraded|unhealthy|error|down|loading/i.test(status)) return false;

  return true;
}

// Polls /health so the UI can tell the user the backend is down *before* they
// pick an image, instead of failing at prediction time.
export function useBackendHealth() {
  const [health, setHealth] = useState({ status: "checking", detail: "" });
  const inFlightRef = useRef(false);

  const check = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    try {
      const body = await fetchHealth(controller.signal);

      setHealth(
        readModelReady(body)
          ? { status: "online", detail: "Ready for prediction" }
          : { status: "degraded", detail: "Model not loaded yet" }
      );
    } catch (err) {
      setHealth({
        status: "offline",
        detail: err.name === "AbortError" ? "Server not responding" : "Server unreachable",
      });
    } finally {
      clearTimeout(timer);
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (!cancelled) check();
    };

    // Kick the first poll off the effect body so the initial render isn't
    // followed by a synchronous state update.
    const kickoff = setTimeout(run, 0);
    const interval = setInterval(run, HEALTH_POLL_MS);

    // Re-check on the events that most often mean "it might be back now".
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", run);

    return () => {
      cancelled = true;
      clearTimeout(kickoff);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", run);
    };
  }, [check]);

  return { health, recheckHealth: check };
}
