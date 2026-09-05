import { Component } from "react";
import { TriangleAlert, RotateCcw } from "lucide-react";

/** Wraps a single dashboard section so a crash inside it never blanks the
 *  whole app — only that section shows a compact retry card. */
export default class SectionBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(`Section error [${this.props.label || "unknown"}]:`, error, info?.componentStack);
  }

  handleRetry = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-state" style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 32 }}>
          <TriangleAlert size={28} />
          <p>The {this.props.label || "section"} failed to load.</p>
          <button className="btn-outline" onClick={this.handleRetry}>
            <RotateCcw size={13} /> Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
