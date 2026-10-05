import { useCallback, useMemo, useState } from "react";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import SarfaesiDashboard from "./pages/SarfaesiDashboard";

import { cases, currentUserId, users } from "./data/mockData";
import {
  enrichCases,
  getUser,
  isAdmin,
  matchesSearch,
  visibleCasesFor,
} from "./utils/cases";

/**
 * The shell: sidebar, header, and the dashboard.
 *
 * Who is signed in decides what the dashboard is a dashboard of. An admin gets
 * the whole book; a salesperson gets their own patch, and every figure below
 * follows from that one list rather than from a flag passed around.
 *
 * There is no authentication here - the app has no backend - so the header
 * menu switches the active user. It is a point of view, not a permission.
 */
const SARFAESI_HOME = "sarfaesi";

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [page, setPage] = useState("case-lead");
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState(currentUserId);

  const currentUser = getUser(userId);

  // Pinned once per mount so every panel reports against the same "today".
  const today = useMemo(() => new Date(), []);

  const allCases = useMemo(() => enrichCases(cases, today), [today]);

  const ownedCases = useMemo(
    () => visibleCasesFor(allCases, currentUser),
    [allCases, currentUser]
  );

  const visibleCases = useMemo(
    () => ownedCases.filter((item) => matchesSearch(item, searchQuery)),
    [ownedCases, searchQuery]
  );

  const closeSidebar = useCallback(() => setMobileOpen(false), []);

  const onSarfaesi = page === SARFAESI_HOME;

  return (
    <div className="app-layout">
      <Sidebar
        user={currentUser}
        mobileOpen={mobileOpen}
        onClose={closeSidebar}
        activeItem={page}
        onNavigate={setPage}
      />

      <main className="main-content">
        <Header
          user={currentUser}
          users={users}
          onSignIn={setUserId}
          title={onSarfaesi ? "SARFAESI" : "Case Lead Dashboard"}
          subtitle={
            onSarfaesi
              ? "Symbolic, Section 14 and Physical — allotted cases only"
              : isAdmin(currentUser)
                ? `Every case across the team — ${ownedCases.length} in total`
                : `${currentUser?.city ?? "Unassigned"} — ${ownedCases.length} cases`
          }
          onOpenSidebar={() => setMobileOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="dashboard-content">
          {onSarfaesi ? (
            // SARFAESI reads off the same per-user scope: an admin runs the
            // whole book, a salesperson only their own.
            <SarfaesiDashboard cases={visibleCases} />
          ) : (
            <Dashboard
              cases={visibleCases}
              allCases={ownedCases}
              today={today}
            />
          )}
        </div>
      </main>
    </div>
  );
}
