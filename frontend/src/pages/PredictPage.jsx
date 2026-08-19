import { UploadCard } from "../components/UploadCard";
import { usePrediction } from "../context/usePrediction";

export default function PredictPage() {
  const { image, fileName, prediction, loading, error, hasImage, retry, reset } =
    usePrediction();

  return (
    <section className="page-container">
      <div className="privacy-banner">
        <span className="privacy-icon" aria-hidden="true">
          🔒
        </span>
        <p>
          We respect your privacy. Photos are processed instantly and never stored or
          shared.
        </p>
      </div>

      {/* This page owns the whole prediction step: pick an image, then see the
          result. Clearing the image returns to the picker in place rather than
          sending the user to another route. */}
      {!hasImage ? <UploadCard /> : (
        <ResultCard
          image={image}
          fileName={fileName}
          prediction={prediction}
          loading={loading}
          error={error}
          onRetry={retry}
          onReset={reset}
        />
      )}
    </section>
  );
}

function ResultCard({ image, fileName, prediction, loading, error, onRetry, onReset }) {
  let ageText = "--";
  if (loading) ageText = "…";
  else if (prediction) ageText = prediction.age;

  let rangeText = "Waiting for prediction";
  if (loading) rangeText = "Analyzing your image…";
  else if (prediction) rangeText = `${prediction.minAge} – ${prediction.maxAge} years`;

  return (
    <div className="glass-card result-card">
      <div className="result-image-wrapper">
        {image ? (
          <div className="scan-preview">
            <img src={image} alt={`Selected photo: ${fileName}`} className="scan-image" />

            {/* The scan animation reads as "working", so only show it while a
                prediction is actually in flight. */}
            {loading && (
              <div className="scan-overlay" aria-hidden="true">
                <div className="scan-frame">
                  <span className="scan-corner tl"></span>
                  <span className="scan-corner tr"></span>
                  <span className="scan-corner bl"></span>
                  <span className="scan-corner br"></span>

                  <div className="scan-line-overlay"></div>
                  <div className="scan-grid"></div>

                  <div className="scan-label-overlay">
                    <span className="scan-dot"></span>
                    FACIAL ANALYSIS
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="image-placeholder">
            <span aria-hidden="true">◉</span>
            <p>No image selected</p>
          </div>
        )}
      </div>

      <div className="result-content">
        <span className="eyebrow">AI PREDICTION</span>

        <h2>Estimated Age</h2>

        <div className="age-value" aria-live="polite">
          {ageText}
          <span>years</span>
        </div>

        <div className="age-range">
          Estimated range:
          <strong>{rangeText}</strong>
        </div>

        <div className="result-file">
          <span>Image</span>
          <strong title={fileName}>{fileName || "uploaded-image.jpg"}</strong>
        </div>

        {error && (
          <div className="error-box" role="alert">
            {error}
          </div>
        )}

        <button
          type="button"
          className="primary-button"
          onClick={onRetry}
          disabled={loading}
        >
          {loading ? "Analyzing…" : prediction ? "Predict Again" : "Retry Prediction"}
          <span aria-hidden="true">→</span>
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={onReset}
          disabled={loading}
        >
          Use a Different Image
        </button>
      </div>
    </div>
  );
}
