import { createRoot } from "react-dom/client";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import "./index.css";
import "./tahoe-green.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("PacketPath bootstrap failed: #root element was not found");
}

createRoot(rootElement).render(
  <AppErrorBoundary>
    <>
      <div className="luminous-orb one" />
      <div className="luminous-orb two" />
      <div className="luminous-orb three" />
      <App />
    </>
  </AppErrorBoundary>,
);
