import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { ErrorPage } from "./ErrorPage";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Global error boundary that catches unhandled React rendering errors
 * and displays the maintenance / error page instead of a blank screen.
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary] Uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage type="maintenance" />;
    }
    return this.props.children;
  }
}
