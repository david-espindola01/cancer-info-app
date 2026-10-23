"use client";

import { useEffect } from "react";

/**
 * Installs `public/sw.js`, which lets people read without signal the pages they saved or
 * opened recently. Only in production: in development it would serve stale pages.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Without the service worker the site works the same, only without offline reading.
    });
  }, []);
  return null;
}
