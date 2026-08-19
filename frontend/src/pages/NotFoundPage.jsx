import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="page-container">
      <div className="glass-card empty-history">
        <div className="empty-icon" aria-hidden="true">
          ?
        </div>

        <h2>Page not found</h2>

        <p>That address doesn&apos;t match any page in AGE AI.</p>

        <Link to="/" className="primary-button empty-cta">
          Back to dashboard
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
