// PWA Service Worker Registration & Update Lifecycle Manager

export type PwaUpdateCallback = (reload: () => void) => void;

let updateListeners: PwaUpdateCallback[] = [];
let waitingWorker: ServiceWorker | null = null;

export function onPwaUpdate(callback: PwaUpdateCallback): () => void {
  updateListeners.push(callback);
  // If a waiting worker already exists, notify immediately
  if (waitingWorker) {
    callback(reloadToUpdate);
  }
  return () => {
    updateListeners = updateListeners.filter((cb) => cb !== callback);
  };
}

export function reloadToUpdate(): void {
  if (waitingWorker) {
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }
  window.location.reload();
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

      // Check if an update is already waiting
      if (reg.waiting) {
        waitingWorker = reg.waiting;
        updateListeners.forEach((cb) => cb(reloadToUpdate));
      }

      // Detect new service worker installing
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New version installed while old version is controlling the page
            waitingWorker = newWorker;
            console.log("[PWA] New version ready to activate.");
            updateListeners.forEach((cb) => cb(reloadToUpdate));
          }
        });
      });

      // Handle controller change (when new SW claims the page)
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      // Check for updates on visibilitychange (e.g. mobile user returns to the installed PWA)
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          reg.update().catch((err) => console.warn("[PWA] Background update check failed:", err));
        }
      });

      // Periodic update check every 30 minutes
      setInterval(() => {
        reg.update().catch((err) => console.warn("[PWA] Periodic update check failed:", err));
      }, 30 * 60 * 1000);

    } catch (err) {
      console.warn("[PWA] Service worker registration failed:", err);
    }
  });
}
