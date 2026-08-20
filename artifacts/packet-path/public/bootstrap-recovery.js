(() => {
  const BOOT_TIMEOUT_MS = 6_000;
  let firstScriptError = null;

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

  function compact(value) {
    return String(value || "unknown error").replace(/\s+/g, " ").slice(0, 220);
  }

  window.addEventListener("error", event => {
    if (firstScriptError) return;
    firstScriptError = {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    };
  });

  window.addEventListener("unhandledrejection", event => {
    if (firstScriptError) return;
    firstScriptError = { message: compact(event.reason) };
  });

  async function reportFailure() {
    if (!getShell()) return;

    let health = "API unreachable";
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      health = response.ok ? "API healthy" : `API HTTP ${response.status}`;
    } catch {}

    const appScript = [...document.scripts].find(script => /\/assets\/.*\.js(?:$|\?)/.test(script.src));
    if (!appScript) {
      setBootMessage("PacketPath could not start", `${health} · production application script missing`);
      return;
    }

    let asset = "application script unreachable";
    try {
      const response = await fetch(appScript.src, { cache: "reload" });
      const mime = (response.headers.get("content-type") || "unknown MIME").split(";")[0];
      asset = `script ${response.status} · ${mime} · ${new URL(appScript.src).pathname}`;
    } catch (error) {
      asset = `script request failed · ${compact(error)}`;
    }

    if (firstScriptError) {
      const where = firstScriptError.filename
        ? ` · ${firstScriptError.filename.split("/").pop()}:${firstScriptError.lineno || 0}:${firstScriptError.colno || 0}`
        : "";
      setBootMessage("PacketPath application crashed", `${health} · ${compact(firstScriptError.message)}${where}`);
      return;
    }

    setBootMessage("PacketPath did not mount", `${health} · ${asset}`);
  }

  window.__PACKETPATH_BOOT_PROBE__ = {
    loadedAt: new Date().toISOString(),
    version: "2026-08-19.2-classic",
  };

  const start = () => {
    if (!getShell()) return;
    setBootMessage("Loading PacketPath…", "Classic browser bootstrap active · starting the Occu-Med workflow application");
    window.setTimeout(() => void reportFailure(), BOOT_TIMEOUT_MS);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
