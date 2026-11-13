import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode; label?: string };
type State = { error: Error | null; recoveryKey: number };

/** Prevents a single React crash from blanking the whole app (white screen). */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, recoveryKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ""}]`, error, info);
  }

  render() {
    if (!this.state.error) {
      return <div key={this.state.recoveryKey}>{this.props.children}</div>;
    }

    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <p className="text-lg font-bold">Something went wrong</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          {this.props.label ? `${this.props.label}: ` : ""}
          {this.state.error.message || "Unexpected error"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              this.setState((s) => ({ error: null, recoveryKey: s.recoveryKey + 1 }))
            }
          >
            Try again
          </Button>
          <Button onClick={() => window.location.assign("/dashboard")}>
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }
}
