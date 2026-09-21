import { createContext, useContext } from "react";

import { HIGH_LIABILITY_THRESHOLD } from "../utils/cases";
import { DUE_SOON_THRESHOLD_DAYS } from "../utils/format";

export const STORAGE_KEY = "caselead.settings";

export const DEFAULT_SETTINGS = {
  highLiabilityThreshold: HIGH_LIABILITY_THRESHOLD,
  dueSoonDays: DUE_SOON_THRESHOLD_DAYS,
};

export const SettingsContext = createContext(DEFAULT_SETTINGS);

export function useSettings() {
  return useContext(SettingsContext);
}

/** Storage can throw outright in private mode, so every access is guarded. */
export function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw);
    return {
      highLiabilityThreshold:
        Number(parsed.highLiabilityThreshold) ||
        DEFAULT_SETTINGS.highLiabilityThreshold,
      dueSoonDays: Number(parsed.dueSoonDays) || DEFAULT_SETTINGS.dueSoonDays,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
