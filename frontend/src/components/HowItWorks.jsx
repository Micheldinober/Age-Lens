const STEPS = [
  {
    number: "01",
    icon: "↑",
    title: "Upload Image",
    description: "Choose a JPG or PNG facial image from your device.",
  },
  {
    number: "02",
    icon: "◎",
    title: "Face Detection",
    description: "The system detects and focuses on the facial region in the image.",
  },
  {
    number: "03",
    icon: "AI",
    title: "Feature Analysis",
    description: "The AI examines facial patterns and age-related visual features.",
  },
  {
    number: "04",
    icon: "✓",
    title: "Age Prediction",
    description: "The model returns the estimated age and a likely age range.",
  },
];

export function HowItWorks() {
  return (
    <div className="how-section">
      <div className="section-title">
        <div>
          <span className="eyebrow">SIMPLE PROCESS</span>

          <h3>How age prediction works</h3>
        </div>
      </div>

      <p className="how-description">
        AGE AI takes a facial image, identifies the face, studies important visual
        features, and then uses the trained AI model to estimate the person&apos;s age.
      </p>

      <div className="how-flow-note">
        <span className="how-flow-dot" aria-hidden="true"></span>
        <p>
          For better results, use a clear, front-facing image with good lighting and
          minimum blur.
        </p>
      </div>

      <div className="how-steps how-steps-four">
        {STEPS.map((step) => (
          <div key={step.number}>
            <span>{step.number}</span>
            <div className="how-step-icon" aria-hidden="true">
              {step.icon}
            </div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
