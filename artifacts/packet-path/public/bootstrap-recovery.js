(() => {
  const BOOT_TIMEOUT_MS = 6_000;

  function getShell() {
    return document.querySelector(".packetpath-boot");
  }

  function setBootMessage(title, subtitle) {
    const shell = getShell();
    if (!shell) return;

    const titleNode = shell.querySelector(".packetpath-boot-title");
    const subtitleNode = shell.querySelector(".packetpath-boot-subtitle");
    if (titleNode) titleNode.textContent = title;
    if (subtitleNode) subtitleNode.textContent = subtitle;
  }

  function compactError(error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.replace(/\s+/g, " ").slice(0, 180);
  }

  async function probeHealth() {
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      return response.ok ? "API healthy" : `API HTTP ${response.status}`;
    } catch (error) {
      return `API unreachable (${compactError(error)})`;
    }
  }

  async function recoverModule() {
    if (!getShell()) return;

    const moduleScript = document.querySelector('script[type="module"][src]');
    const health = await probeHealth();

    if (!moduleScript) {
      setBootMessage("PacketPath could not start", `${health} · production module tag missing`);
      return;
    }

    const moduleUrl = moduleScript.src;
    let response;

    try {
      response = await fetch(moduleUrl, { cache: "reload" });
    } catch (error) {
      setBootMessage(
        "PacketPath could not start",
        `${health} · module request failed: ${compactError(error)}`,
      );
      return;
    }

    const mime = (response.headers.get("content-type") || "unknown MIME").split(";")[0];
    if (!response.ok) {
      setBootMessage(
        "PacketPath could not start",
        `${health} · module ${response.status} · ${mime} · ${new URL(moduleUrl).pathname}`,
      );
      return;
    }

    if (!/(?:java|ecma)script/i.test(mime)) {
      setBootMessage(
        "PacketPath could not start",
        `${health} · module returned ${mime} instead of JavaScript · ${new URL(moduleUrl).pathname}`,
      );
      return;
    }

    setBootMessage("Recovering PacketPath…", `${health} · retrying ${new URL(moduleUrl).pathname}`);

    try {
      const separator = moduleUrl.includes("?") ? "&" : "?";
      await import(`${moduleUrl}${separator}packetpath_recovery=${Date.now()}`);
      await new Promise(resolve => window.setTimeout(resolve, 1_500));

      if (getShell()) {
        setBootMessage(
          "PacketPath module loaded but app did not mount",
          `${health} · ${mime} · check the browser console for the application startup exception`,
        );
      }
    } catch (error) {
      setBootMessage(
        "PacketPath module execution failed",
        `${health} · ${mime} · ${compactError(error)}`,
      );
    }
  }

  window.__PACKETPATH_BOOT_PROBE__ = {
    loadedAt: new Date().toISOString(),
    version: "2026-08-19.1",
  };

  const start = () => {
    if (!getShell()) return;
    setBootMessage("Loading PacketPath…", "Browser bootstrap active · starting the Occu-Med workflow application");
    window.setTimeout(() => void recoverModule(), BOOT_TIMEOUT_MS);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
