import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary so an uncaught render error doesn't leave the
 * user on a blank white screen. Logs to the console for now; once analytics
 * are wired (PostHog/Sentry), forward the error there in componentDidCatch.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // TODO: forward to error-tracking service (Sentry/PostHog) once configured.
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex min-h-screen items-center justify-center bg-background px-4"
        >
          <div className="mx-auto max-w-md space-y-4 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="text-muted-foreground">
              We hit an unexpected error. Try refreshing — if it keeps happening, let us
              know at support@orlandosoasis.com.
            </p>
            {import.meta.env.DEV && this.state.error?.message ? (
              <pre className="rounded bg-muted p-3 text-left text-xs text-muted-foreground">
                {this.state.error.message}
              </pre>
            ) : null}
            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={this.handleReload}>Refresh page</Button>
              <Button variant="outline" onClick={this.handleHome}>
                Go home
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
