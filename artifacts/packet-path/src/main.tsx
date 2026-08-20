import { createRoot } from "react-dom/client";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { startBootstrapWatchdog } from "./bootstrap-watchdog";
import "./index.css";
import "./tahoe-green.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("PacketPath bootstrap failed: #root element was not found");
}

startBootstrapWatchdog();

try {
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
} catch (error: unknown) {
  console.error("PacketPath frontend bootstrap failed", error);
  rootElement.innerHTML = `
    <div class="packetpath-boot" role="alert">
      <div class="packetpath-boot-card">
        <span class="packetpath-boot-dot" aria-hidden="true"></span>
        <div>
          <div class="packetpath-boot-title">PacketPath failed to start</div>
          <div class="packetpath-boot-subtitle">The frontend bundle loaded but React could not mount. Check the browser console for the startup exception.</div>
        </div>
      </div>
    </div>
  `;
}
