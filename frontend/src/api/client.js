export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function readErrorDetail(response) {
  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await response.json();
      if (body && body.detail) return body.detail;
    }
  } catch {
    // response body wasn't valid JSON; fall through to status-based message
  }
  return null;
}

async function throwForResponse(response, fallbackByStatus) {
  const detail = await readErrorDetail(response);
  const message =
    detail || fallbackByStatus[response.status] || `Request failed (${response.status})`;
  const error = new Error(message);
  error.status = response.status;
  throw error;
}

export async function uploadPic(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    await throwForResponse(response, {
      400: "That image couldn't be uploaded. Please use a JPG or PNG under 5 MB.",
    });
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return {};
}

export async function predict(file, uploadedImageUrl = "") {
  const formData = new FormData();
  formData.append("image", file);

  if (uploadedImageUrl) {
    formData.append("image_url", uploadedImageUrl);
  }

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    await throwForResponse(response, {
      400: "That image couldn't be processed. Please use a JPG or PNG under 5 MB.",
      422: "No face detected in the image. Try a clearer, front-facing photo.",
      503: "The AI model isn't available on the server right now. Please try again later.",
    });
  }

  return response.json();
}

export async function fetchHealth(signal) {
  const response = await fetch(`${API_BASE_URL}/health`, { signal, cache: "no-store" });

  if (!response.ok) {
    const error = new Error(`Health check failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return {};

  try {
    return await response.json();
  } catch {
    // A 200 with an unparseable body still means the server is up.
    return {};
  }
}
