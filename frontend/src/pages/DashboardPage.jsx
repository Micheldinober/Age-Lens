import { Link } from "react-router-dom";
import { FaceScanner } from "../components/FaceScanner";
import { HowItWorks } from "../components/HowItWorks";

export default function DashboardPage() {
  return (
    <section className="page-container">
      <div className="hero-section">
        <div className="hero-content">
          <span className="eyebrow">AI-POWERED ANALYSIS</span>

          <h2>
            Discover the age
            <br />
            <span>your face reveals.</span>
          </h2>

          <p>
            Upload a clear facial image and let our AI estimate your age using advanced
            image analysis technology.
          </p>

          <div className="hero-actions">
            <Link to="/predict" className="primary-button hero-cta">
              Start Age Prediction
              <span aria-hidden="true">→</span>
            </Link>

            <p className="hero-hint">
              Takes a few seconds · JPG or PNG · you can also drop or paste an image
              anywhere
            </p>
          </div>
        </div>

        <FaceScanner />
      </div>

      <HowItWorks />
    </section>
  );
}
