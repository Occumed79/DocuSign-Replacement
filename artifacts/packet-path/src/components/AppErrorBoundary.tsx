import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[PacketPath] React render failure", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main
        role="alert"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "#060d1f",
          color: "#f4f7f6",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <section
          style={{
            width: "min(560px, 100%)",
            padding: 28,
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,.14)",
            background: "rgba(255,255,255,.06)",
            boxShadow: "0 24px 70px rgba(0,0,0,.38)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24 }}>PacketPath could not finish loading</h1>
          <p style={{ margin: "12px 0 20px", lineHeight: 1.6, opacity: 0.78 }}>
            The application hit a browser-side startup error. The error has been written to the
            browser console instead of leaving this page blank.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              border: 0,
              borderRadius: 12,
              padding: "11px 16px",
              fontWeight: 700,
              cursor: "pointer",
              background: "#8dbeb5",
              color: "#031219",
            }}
          >
            Reload application
          </button>
        </section>
      </main>
    );
  }
}
