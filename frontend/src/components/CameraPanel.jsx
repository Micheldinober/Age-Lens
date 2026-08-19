export function CameraPanel({ videoRef, onCapture, onClose }) {
  return (
    <div className="camera-area">
      <div className="camera-status">
        <span className="camera-status-dot" aria-hidden="true"></span>
        CAMERA ACTIVE
        <span className="camera-live">LIVE</span>
      </div>

      <div className="camera-preview">
        <video ref={videoRef} autoPlay playsInline muted />

        <div className="camera-overlay" aria-hidden="true">
          <span className="camera-corner top-left"></span>
          <span className="camera-corner top-right"></span>
          <span className="camera-corner bottom-left"></span>
          <span className="camera-corner bottom-right"></span>

          <div className="camera-scan-line"></div>

          <div className="camera-label">
            <span></span>
            FACE ANALYSIS
          </div>
        </div>
      </div>

      <div className="camera-actions">
        <button type="button" className="camera-capture-button" onClick={onCapture}>
          <span aria-hidden="true">📸</span>
          Capture Photo
        </button>

        <button type="button" className="camera-close-button" onClick={onClose}>
          ✕ Close Camera
        </button>
      </div>
    </div>
  );
}
