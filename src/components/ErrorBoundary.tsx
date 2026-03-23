import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let details = "";

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) {
            errorMessage = "Database Permission Error";
            details = `Operation: ${parsed.operationType} on ${parsed.path}. ${parsed.error}`;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 max-w-md w-full text-center space-y-6 backdrop-blur-xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">{errorMessage}</h2>
              {details && <p className="text-sm text-white/40 font-mono break-all">{details}</p>}
              {!details && <p className="text-sm text-white/40">The application encountered a problem. Please try refreshing the page.</p>}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-red-500 hover:bg-red-400 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              REFRESH APPLICATION
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
