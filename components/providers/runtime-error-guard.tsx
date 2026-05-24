"use client";

import { useEffect } from "react";

function isBrowserEventError(value: unknown) {
  return typeof Event !== "undefined" && value instanceof Event;
}

export function RuntimeErrorGuard() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      if (event.message === "[object Event]" || isBrowserEventError(event.error)) {
        event.preventDefault();
      }
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      if (isBrowserEventError(event.reason)) {
        event.preventDefault();
      }
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
