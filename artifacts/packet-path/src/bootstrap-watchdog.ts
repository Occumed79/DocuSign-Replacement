export const BOOTSTRAP_WATCHDOG_MS = 8_000;

export function startBootstrapWatchdog() {
  window.setTimeout(async () => {
    const root = document.getElementById("root");
    if (!root?.querySelector(".packetpath-boot")) return;

    let health = "unreachable";
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      health = response.ok ? "healthy" : `HTTP ${response.status}`;
    } catch {
      health = "unreachable";
    }

    const subtitle = root.querySelector(".packetpath-boot-subtitle");
    if (subtitle) {
      subtitle.textContent = `Frontend failed to start · API ${health} · refresh after deployment`;
    }
  }, BOOTSTRAP_WATCHDOG_MS);
}
