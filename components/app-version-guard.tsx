"use client";

import { useEffect } from "react";

const BUILD_VERSION_STORAGE_KEY = "all-at-once:build-version";

export function AppVersionGuard() {
  useEffect(() => {
    const currentBuildVersion = process.env.NEXT_PUBLIC_APP_BUILD_VERSION;

    if (!currentBuildVersion) {
      return;
    }

    try {
      const previousBuildVersion = window.localStorage.getItem(
        BUILD_VERSION_STORAGE_KEY,
      );

      if (previousBuildVersion === currentBuildVersion) {
        return;
      }

      window.localStorage.setItem(
        BUILD_VERSION_STORAGE_KEY,
        currentBuildVersion,
      );
      window.location.reload();
    } catch {
      // If storage is unavailable, do not reload because it could create a loop.
    }
  }, []);

  return null;
}
