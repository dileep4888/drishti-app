import { Component } from "react";
import { TriangleAlert, RotateCcw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Keep a breadcrumb in the console for debugging, never shown to users
    console.error("Drishti UI error:", error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-card">
            <div className="error-boundary-icon"><TriangleAlert size={28} /></div>
            <h2>Something went wrong</h2>
            <p>
              An unexpected error occurred while rendering this section.
              Your data is safe — please try again.
            </p>
            <div className="error-boundary-actions">
              <button className="btn-primary" onClick={this.handleReset}>
                <RotateCcw size={14} /> Try Again
              </button>
              <button className="btn-outline" onClick={() => window.location.reload()}>
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
