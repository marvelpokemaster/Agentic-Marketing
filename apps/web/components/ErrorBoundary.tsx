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
        <div className="card border-rose-500/20 bg-rose-500/5 p-6 rounded-xl space-y-4 max-w-4xl mx-auto my-8 relative z-10">
          <div className="flex items-center gap-3 text-rose-400">
            <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-lg font-bold">Failed to render Campaign Dashboard</h2>
          </div>
          
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted block">Runtime Diagnostic:</span>
            <pre className="text-xs text-rose-300 leading-relaxed font-mono bg-[#09090b]/80 p-4 rounded-lg border border-border/40 overflow-x-auto whitespace-pre-wrap">
              {this.state.error?.toString() || "Unknown exception"}
              {"\n\nStack Trace:\n"}
              {this.state.error?.stack || "No stack trace available."}
            </pre>
          </div>

          <div className="pt-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn btn-sm"
            >
              Reset view state
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
