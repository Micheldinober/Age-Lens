import { usePrediction } from "../context/usePrediction";
import { useCamera } from "../hooks/useCamera";
import { useDragActive } from "../hooks/useDragActive";
import { CameraPanel } from "./CameraPanel";
import { HealthNotice } from "./HealthNotice";

export function UploadCard() {
  const { error, health, setError, selectImage, recheckHealth } = usePrediction();

  const dragActive = useDragActive();

  // The camera lives here, so leaving this route unmounts it and the stream is
  // torn down automatically.
  const { cameraOpen, videoRef, openCamera, closeCamera, capturePhoto } = useCamera({
    onCapture: selectImage,
    onError: setError,
  });

  const handleOpenCamera = () => {
    setError("");
    openCamera();
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0];
    // Clear the input so picking the same file twice still fires a change event.
    event.target.value = "";
    if (file) selectImage(file);
  };

  return (
    <div className="glass-card upload-card">
      <div className="card-header">
        <div>
          <h3>Upload Your Image</h3>

          <p>Choose a clear, front-facing image for better prediction accuracy.</p>
        </div>

        <div className="card-badge">JPG · PNG</div>
      </div>

      <HealthNotice status={health.status} onRetry={recheckHealth} />

      {error && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}

      {cameraOpen ? (
        <CameraPanel
          videoRef={videoRef}
          onCapture={capturePhoto}
          onClose={closeCamera}
        />
      ) : (
        <>
          <label
            className={`upload-area ${dragActive ? "drag-active" : ""}`}
            htmlFor="image-input"
          >
            {/* Kept focusable (not display:none) so the control is reachable by
                keyboard; :focus-within draws the ring on this label. */}
            <input
              id="image-input"
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileInputChange}
            />

            <div className="upload-circle" aria-hidden="true">
              ↑
            </div>

            <h4>Drag &amp; drop your image here</h4>

            <p>or click to browse from your device</p>

            <span className="browse-button">Choose Image</span>

            <small>JPG or PNG · maximum 5 MB · you can also paste an image</small>
          </label>

          <div className="camera-divider" aria-hidden="true">
            <span></span>
            OR
            <span></span>
          </div>

          <button
            type="button"
            className="open-camera-button"
            onClick={handleOpenCamera}
          >
            <span aria-hidden="true">📷</span>
            Use Your Camera
          </button>
        </>
      )}
    </div>
  );
}
