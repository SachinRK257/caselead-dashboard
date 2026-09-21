import { useCallback, useMemo, useState } from "react";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import SettingsProvider from "./context/SettingsProvider";
import { useSettings } from "./context/settingsCore";

import AssignCasesPage from "./pages/AssignCasesPage";
import AllCasesPage from "./pages/AllCasesPage";
import BankVisitsPage from "./pages/BankVisitsPage";
import Dashboard from "./pages/Dashboard";
import DeadlinesPage from "./pages/DeadlinesPage";
import DocumentsPage from "./pages/DocumentsPage";
import SettingsPage from "./pages/SettingsPage";

import { cases, currentUserId, notifications } from "./data/mockData";
import { enrichCases, getSalesperson, matchesSearch } from "./utils/cases";
import { navigate, ROUTES, useRoute } from "./router";

const PAGES = {
  dashboard: Dashboard,
  cases: AllCasesPage,
  deadlines: DeadlinesPage,
  "bank-visits": BankVisitsPage,
  documents: DocumentsPage,
  assign: AssignCasesPage,
  settings: SettingsPage,
};

/**
 * The shell: sidebar, header and whichever page the hash points at.
 *
 * Search, the read-notification set and the case list live here rather than in
 * a page, so moving between sections keeps them instead of resetting.
 */
function Shell() {
  const route = useRoute();
  const settings = useSettings();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [readNotificationIds, setReadNotificationIds] = useState(
    () => new Set()
  );
  // Assignments made in this session. No backend to post them to, so they
  // live here and the Assign page says as much.
  const [assignments, setAssignments] = useState({});

  const currentUser = getSalesperson(currentUserId);

  // Pinned once per mount so every panel reports against the same "today".
  const today = useMemo(() => new Date(), []);

  const allCases = useMemo(() => {
    const enriched = enrichCases(cases, today, settings.dueSoonDays);

    return enriched.map((item) => {
      const assigned = assignments[item.id];
      if (!assigned) return item;

      return {
        ...item,
        assignedTo: assigned,
        allocationStatus: "ALLOCATED",
        assignedHere: true,
        assignedName: getSalesperson(assigned)?.name ?? "Unknown",
      };
    });
  }, [today, settings.dueSoonDays, assignments]);

  const visibleCases = useMemo(
    () => allCases.filter((item) => matchesSearch(item, searchQuery)),
    [allCases, searchQuery]
  );

  const notificationItems = useMemo(
    () =>
      notifications.map((item) => ({
        ...item,
        unread: item.unread && !readNotificationIds.has(item.id),
      })),
    [readNotificationIds]
  );

  const unreadCount = notificationItems.filter((item) => item.unread).length;

  const markNotificationRead = useCallback((id) => {
    setReadNotificationIds((current) => {
      if (current.has(id)) return current;

      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  const closeSidebar = useCallback(() => setMobileOpen(false), []);

  const handleAssign = useCallback((caseId, salespersonId) => {
    setAssignments((current) => ({ ...current, [caseId]: salespersonId }));
  }, []);

  // There is no auth behind this build, so signing out clears what this
  // session accumulated rather than pretending to end a server session.
  // Saved settings are a device preference and deliberately survive.
  const handleSignOut = useCallback(() => {
    const ok = window.confirm(
      "Sign out? This clears the assignments and search from this session."
    );
    if (!ok) return;

    setAssignments({});
    setReadNotificationIds(new Set());
    setSearchQuery("");
    navigate("dashboard");
  }, []);

  // Badge counts are read off the data, so they can never drift from it.
  const navCounts = useMemo(
    () => ({
      deadlines: allCases.filter(
        (c) => c.timelineStatus === "OVERDUE" || c.timelineStatus === "DUE_SOON"
      ).length,
      "bank-visits": allCases.filter((c) => c.bankVisit === "VISIT_PENDING")
        .length,
      documents: allCases.filter((c) => c.documents === "DOCUMENTS_PENDING")
        .length,
      assign: allCases.filter((c) => c.allocationStatus === "NOT_ALLOCATED")
        .length,
    }),
    [allCases]
  );

  const Page = PAGES[route] ?? Dashboard;
  const meta = ROUTES[route] ?? ROUTES.dashboard;

  return (
    <div className="app-layout">
      <Sidebar
        user={currentUser}
        mobileOpen={mobileOpen}
        onClose={closeSidebar}
        activeItem={route}
        counts={navCounts}
        onNavigate={navigate}
        onSignOut={handleSignOut}
      />

      <main className="main-content">
        <Header
          user={currentUser}
          title={meta.title}
          subtitle={meta.subtitle}
          onOpenSidebar={() => setMobileOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          unreadCount={unreadCount}
        />

        <div className="dashboard-content">
          <Page
            cases={visibleCases}
            allCases={allCases}
            currentUser={currentUser}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery("")}
            today={today}
            notificationItems={notificationItems}
            unreadCount={unreadCount}
            onMarkNotificationRead={markNotificationRead}
            onAssign={handleAssign}
          />

          <footer className="dashboard-footer">
            <span>Case Management Dashboard</span>
            <span>Last updated just now</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <Shell />
    </SettingsProvider>
  );
}
