import React from "react";

function friendlyMessage(error) {
  if (!error?.message) {
    return "An unexpected dashboard rendering error occurred.";
  }

  return error.message;
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      timestamp: ""
    };
  }

  static getDerivedStateFromError(error) {
    return {
      error,
      timestamp: new Date().toLocaleString()
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`${this.props.label || "Dashboard"} render error`, error, errorInfo);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const label = this.props.label || "Dashboard";
    const isSection = this.props.variant === "section";

    return (
      <section className={isSection ? "section-error-fallback" : "error-boundary-screen"} role="alert">
        <div className="error-boundary-panel">
          <div>
            <span className="error-boundary-kicker">{isSection ? "Section unavailable" : "Dashboard protection active"}</span>
            <h2>{label} hit a rendering error</h2>
            <p>{friendlyMessage(this.state.error)}</p>
          </div>

          <div className="error-boundary-meta">
            <span>{this.state.timestamp}</span>
            <span>Check the browser console for technical details.</span>
          </div>

          <button className="button primary" type="button" onClick={() => window.location.reload()}>
            Reload dashboard
          </button>
        </div>
      </section>
    );
  }
}

export default ErrorBoundary;
