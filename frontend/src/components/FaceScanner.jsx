export function FaceScanner() {
  return (
    <div className="face-scanner" aria-hidden="true">
      <div className="scanner-corner scanner-corner-tl"></div>
      <div className="scanner-corner scanner-corner-tr"></div>
      <div className="scanner-corner scanner-corner-bl"></div>
      <div className="scanner-corner scanner-corner-br"></div>

      <div className="scanner-label">
        <span className="scanner-label-dot"></span>
        FACIAL ANALYSIS
      </div>

      <div className="scanner-face">
        <div className="scanner-eye scanner-eye-left">
          <span></span>
        </div>
        <div className="scanner-eye scanner-eye-right">
          <span></span>
        </div>
        <div className="scanner-nose"></div>
        <div className="scanner-mouth"></div>

        <i className="landmark landmark-1"></i>
        <i className="landmark landmark-2"></i>
        <i className="landmark landmark-3"></i>
        <i className="landmark landmark-4"></i>
        <i className="landmark landmark-5"></i>
        <i className="landmark landmark-6"></i>
        <i className="landmark landmark-7"></i>
      </div>

      <div className="scanner-line"></div>

      <div className="scanner-float scanner-float-face">
        <span className="float-dot"></span>
        FACE DETECTED
      </div>

      <div className="scanner-float scanner-float-features">
        <span>✦</span>
        FACIAL FEATURES
      </div>

      <div className="scanner-footer">
        <span>
          <b></b> FACE DETECTED
        </span>
        <span>
          <em>✦</em> READY TO ANALYZE
        </span>
      </div>
    </div>
  );
}
