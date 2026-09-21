import { useEffect, useState } from "react";

/**
 * Hash routing, hand-rolled.
 *
 * A router library would work, but the whole need here is "one of seven views,
 * addressable, with a working back button" - which the hash already gives us.
 * Hash rather than history API so the built site works from any static host
 * without a rewrite rule.
 */
export const ROUTES = {
  dashboard: {
    title: "Case Dashboard",
    subtitle: "Overview of your case leads",
  },
  cases: {
    title: "All Cases",
    subtitle: "Every case on your list",
  },
  deadlines: {
    title: "Deadlines",
    subtitle: "Sorted by how much time is left",
  },
  "bank-visits": {
    title: "Bank Visits",
    subtitle: "Who to visit, and when",
  },
  documents: {
    title: "Missing Documents",
    subtitle: "Papers still to collect from borrowers",
  },
  assign: {
    title: "Assign Cases",
    subtitle: "Cases waiting for an owner",
  },
  settings: {
    title: "Settings",
    subtitle: "How this dashboard behaves",
  },
};

export const DEFAULT_ROUTE = "dashboard";

function readHash() {
  if (typeof window === "undefined") return DEFAULT_ROUTE;

  const id = window.location.hash.replace(/^#\/?/, "").trim();
  return id in ROUTES ? id : DEFAULT_ROUTE;
}

export function navigate(id) {
  if (typeof window === "undefined") return;
  window.location.hash = `#/${id}`;
}

export function useRoute() {
  const [route, setRoute] = useState(readHash);

  useEffect(() => {
    function sync() {
      setRoute(readHash());
    }

    window.addEventListener("hashchange", sync);
    // An unknown or empty hash should settle on a canonical URL.
    if (window.location.hash.replace(/^#\/?/, "").trim() !== route) {
      window.history.replaceState(null, "", `#/${route}`);
    }

    return () => window.removeEventListener("hashchange", sync);
  }, [route]);

  return route;
}
