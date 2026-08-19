import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, predict, uploadPic } from "../api/client";
import { useBackendHealth } from "../hooks/useBackendHealth";
import { normalizePrediction, validateImageFile } from "../utils/image";
import { PredictionContext } from "./PredictionContext";

// Owns everything shared across routes: the chosen image, the prediction, the
// error banner and backend health. Routes read it through usePrediction().
export function PredictionProvider({ children }) {
  const navigate = useNavigate();

  const [image, setImage] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const previewUrlRef = useRef("");

  const { health, recheckHealth } = useBackendHealth();

  // Object URLs leak unless they are revoked. Swap through this helper so the
  // previous preview is always released before a new one replaces it.
  const setPreview = useCallback((url) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = url;
    setImage(url);
  }, []);

  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    },
    []
  );

  const runPrediction = useCallback(
    async (file) => {
      setLoading(true);
      setError("");

      try {
        // /upload is best effort: /predict receives the file directly, so a
        // failed upload should not block the result.
        let imageUrl = "";
        try {
          const uploadResult = await uploadPic(file);
          imageUrl =
            uploadResult.imageUrl || uploadResult.url || uploadResult.fileUrl || "";
        } catch (uploadError) {
          console.warn("Upload failed, predicting from the local file:", uploadError);
        }

        const result = await predict(file, imageUrl);
        //-> data from client.js \'s predict()
        console.log("Prediction result:", result);
        
        setPrediction(normalizePrediction(result));
      } catch (err) {
        setPrediction(null);

        // A failed fetch has no status and surfaces as "Failed to fetch"; say
        // what actually went wrong and re-check health so the indicator agrees.
        if (!err.status) {
          setError(
            `Can't reach the server at ${API_BASE_URL}. Make sure the backend is running.`
          );
          recheckHealth();
        } else {
          setError(err.message || "Prediction failed. Please try again.");
          if (err.status >= 500) recheckHealth();
        }
      } finally {
        setLoading(false);
      }
    },
    [recheckHealth]
  );

  const selectImage = useCallback(
    (file) => {
      const validationError = validateImageFile(file);

      if (validationError) {
        setError(validationError);
        return;
      }

      setPreview(URL.createObjectURL(file));
      setFileName(file.name || "captured-photo.jpg");
      setSelectedFile(file);
      setPrediction(null);
      setError("");

      navigate("/predict");
      runPrediction(file);
    },
    [navigate, runPrediction, setPreview]
  );

  const retry = useCallback(() => {
    if (selectedFile) runPrediction(selectedFile);
  }, [runPrediction, selectedFile]);

  // Clears the chosen image without leaving the page: /predict then falls back
  // to its picker. Navigating away here would strand the user on a route that
  // has no upload control.
  const reset = useCallback(() => {
    setPreview("");
    setFileName("");
    setSelectedFile(null);
    setPrediction(null);
    setError("");
  }, [setPreview]);

  // Drops and pastes are handled for the whole window, so a new image can be
  // supplied from any route — including the result page, where swapping the
  // image is the point.
  //
  // An element only becomes a valid drop target if BOTH dragenter and dragover
  // are cancelled. Cancelling dragover alone works in Chrome but not in Firefox,
  // where the drop is refused and the browser navigates to the dropped file
  // instead — which looks exactly like a full page reload.
  useEffect(() => {
    const allowDrop = (event) => event.preventDefault();

    const handleDrop = (event) => {
      event.preventDefault();

      const file = event.dataTransfer?.files?.[0];
      if (!file) {
        setError("That drop didn't contain a file. Try dragging an image instead.");
        return;
      }

      selectImage(file);
    };

    const handlePaste = (event) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) selectImage(file);
          break;
        }
      }
    };

    window.addEventListener("dragenter", allowDrop);
    window.addEventListener("dragover", allowDrop);
    window.addEventListener("drop", handleDrop);
    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("dragenter", allowDrop);
      window.removeEventListener("dragover", allowDrop);
      window.removeEventListener("drop", handleDrop);
      window.removeEventListener("paste", handlePaste);
    };
  }, [selectImage]);

  const value = useMemo(
    () => ({
      image,
      fileName,
      hasImage: Boolean(selectedFile),
      prediction,
      loading,
      error,
      health,
      setError,
      selectImage,
      retry,
      reset,
      recheckHealth,
    }),
    [
      image,
      fileName,
      selectedFile,
      prediction,
      loading,
      error,
      health,
      selectImage,
      retry,
      reset,
      recheckHealth,
    ]
  );

  return (
    <PredictionContext.Provider value={value}>{children}</PredictionContext.Provider>
  );
}
