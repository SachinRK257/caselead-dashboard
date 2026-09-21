import { useCallback, useMemo, useState } from "react";

import {
  DEFAULT_SETTINGS,
  readStored,
  SettingsContext,
  STORAGE_KEY,
} from "./settingsCore";

export default function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(readStored);

  const update = useCallback((patch) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // A rejected write only costs persistence, not the change itself.
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore - the in-memory reset below is what the user asked for.
    }
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo(
    () => ({ ...settings, update, reset }),
    [settings, update, reset]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
