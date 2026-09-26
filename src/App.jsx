import { useCallback, useMemo, useState } from "react";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";

import { cases, currentUserId } from "./data/mockData";
import { enrichCases, getSalesperson, matchesSearch } from "./utils/cases";

/**
 * The shell: sidebar, header, and the dashboard.
 *
 * Deliberately one page. The case list is enriched and search-filtered here so
 * that whatever the dashboard grows into can read it straight off the props.
 */
export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = getSalesperson(currentUserId);

  // Pinned once per mount so every panel reports against the same "today".
  const today = useMemo(() => new Date(), []);

  const allCases = useMemo(() => enrichCases(cases, today), [today]);

  const visibleCases = useMemo(
    () => allCases.filter((item) => matchesSearch(item, searchQuery)),
    [allCases, searchQuery]
  );

  const closeSidebar = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="app-layout">
      <Sidebar
        user={currentUser}
        mobileOpen={mobileOpen}
        onClose={closeSidebar}
      />

      <main className="main-content">
        <Header
          user={currentUser}
          title="Case Lead Dashboard"
          onOpenSidebar={() => setMobileOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="dashboard-content">
          <Dashboard
            cases={visibleCases}
            allCases={allCases}
            currentUser={currentUser}
            today={today}
          />
        </div>
      </main>
    </div>
  );
}
