"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

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
    console.error("Uncaught error inside campaign ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto my-8 max-w-4xl space-y-5 rounded-[10px] border border-danger bg-panel p-6">
          <h2 className="font-heading text-lg font-semibold text-danger">
            Failed to render the campaign dashboard
          </h2>

          <div>
            <span className="eyebrow">Runtime diagnostic</span>
            <pre className="ink mt-3 overflow-x-auto whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed">
              {this.state.error?.toString() || "Unknown exception"}
              {"\n\nStack trace:\n"}
              {this.state.error?.stack || "No stack trace available."}
            </pre>
          </div>

          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-ghost text-[13px]"
          >
            Reset view
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
