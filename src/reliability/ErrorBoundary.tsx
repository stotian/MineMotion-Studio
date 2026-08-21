import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback; receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Short context label shown in the default diagnostic. */
  context?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render/runtime errors in its subtree and shows a readable diagnostic
 * instead of letting React unmount the whole app to a black screen. Deliberately
 * self-contained (no localization or app context) so it still works when those
 * are the thing that failed.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // A black screen tells the user nothing; make the failure visible.
    console.error("MineMotion error boundary", this.props.context ?? "", error, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return (
      <div className="app-error-boundary" role="alert">
        <div className="app-error-card">
          <h1>MineMotion Studio could not start this view</h1>
          {this.props.context ? <p>{this.props.context}</p> : null}
          <pre>{error.message}</pre>
          {error.stack ? <pre className="app-error-stack">{error.stack}</pre> : null}
          <div className="app-error-actions">
            <button type="button" onClick={() => window.location.reload()}>Reload</button>
            <button type="button" onClick={this.reset}>Dismiss</button>
          </div>
        </div>
      </div>
    );
  }
}
