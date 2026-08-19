export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export function validateImageFile(file) {
  if (!file) return "No image was selected.";

  if (!file.type.startsWith("image/")) {
    return "That file isn't an image. Please choose a JPG or PNG.";
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Unsupported image format. Please use a JPG or PNG.";
  }

  if (file.size > MAX_FILE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return `That image is ${sizeMb} MB. Please choose one under 5 MB.`;
  }

  return "";
}

export function normalizePrediction(result) {
  const rawAge = Number(result.age ?? result.predicted_age ?? result.prediction ?? 0);
  const age = Math.round(Number.isFinite(rawAge) ? rawAge : 0);

  const rawMin = Number(result.min_age ?? result.minAge ?? Math.max(0, age - 3));
  const rawMax = Number(result.max_age ?? result.maxAge ?? age + 3);

  return {
    age,
    minAge: Math.round(Number.isFinite(rawMin) ? rawMin : 0),
    maxAge: Math.round(Number.isFinite(rawMax) ? rawMax : 0),
  };
}
