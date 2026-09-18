import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Clock3,
  FileWarning,
} from "lucide-react";

import BankCases from "../components/BankCases";
import BankVisitCases from "../components/BankVisitCases";
import Header from "../components/Header";
import HighLiabilityCases from "../components/HighLiabilityCases";
import Notifications from "../components/Notifications";
import PendingDocuments from "../components/PendingDocuments";
import RecentActivities from "../components/RecentActivities";
import SalesTeam from "../components/SalesTeam";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import TimelineCases from "../components/TimelineCases";

import {
  bankData,
  cases,
  currentUserId,
  notifications,
} from "../data/mockData";
import {
  enrichCases,
  getSalesperson,
  isHighLiability,
  matchesSearch,
} from "../utils/cases";
import { formatLongDate } from "../utils/format";

export default function Dashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [readNotificationIds, setReadNotificationIds] = useState(
    () => new Set()
  );

  const currentUser = getSalesperson(currentUserId);
  const firstName = currentUser?.name.split(" ")[0] ?? "there";

  // Pinned once per mount so every panel reports against the same "today".
  const today = useMemo(() => new Date(), []);

  const allCases = useMemo(() => enrichCases(cases, today), [today]);

  const visibleCases = useMemo(
    () => allCases.filter((item) => matchesSearch(item, searchQuery)),
    [allCases, searchQuery]
  );

  const stats = useMemo(() => {
    const count = (predicate) => visibleCases.filter(predicate).length;

    return {
      // The bank breakdown is the book of record for the portfolio size.
      totalCases: bankData.reduce((sum, bank) => sum + bank.count, 0),
      pendingAllocation: count(
        (item) => item.allocationStatus === "NOT_ALLOCATED"
      ),
      highLiability: count(isHighLiability),
      dueSoon: count((item) => item.timelineStatus === "DUE_SOON"),
      overdue: count((item) => item.timelineStatus === "OVERDUE"),
      pendingVisits: count((item) => item.bankVisit === "VISIT_PENDING"),
      pendingDocuments: count(
        (item) => item.documents === "DOCUMENTS_PENDING"
      ),
    };
  }, [visibleCases]);

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

  return (
    <div className="app-layout">
      <Sidebar user={currentUser} mobileOpen={mobileOpen} onClose={closeSidebar} />

      <main className="main-content">
        <Header
          user={currentUser}
          onOpenSidebar={() => setMobileOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          unreadCount={unreadCount}
        />

        <div className="dashboard-content">
          <div className="welcome-row">
            <div>
              <h2>Good morning, {firstName} 👋</h2>
              <p>Here&apos;s what&apos;s happening with your case leads today.</p>
            </div>

            <button type="button" className="date-button">
              {formatLongDate(today)}
            </button>
          </div>

          {searchQuery.trim() && (
            <p className="search-summary" role="status">
              {visibleCases.length} of {allCases.length} cases match &ldquo;
              {searchQuery.trim()}&rdquo;
            </p>
          )}

          <section className="stats-grid" aria-label="Case summary">
            <StatCard
              title="Total Cases"
              value={stats.totalCases}
              description="All active cases"
              icon={BriefcaseBusiness}
            />

            <StatCard
              title="Pending Allocation"
              value={stats.pendingAllocation}
              description="Cases awaiting allocation"
              icon={Clock3}
            />

            <StatCard
              title="High Liability"
              value={stats.highLiability}
              description="Above priority threshold"
              icon={AlertTriangle}
            />

            <StatCard
              title="Due Soon"
              value={stats.dueSoon}
              description="Requires attention"
              icon={CalendarClock}
              className="warning-card"
            />

            <StatCard
              title="Overdue"
              value={stats.overdue}
              description="Action required"
              icon={AlertTriangle}
              className="danger-card"
            />

            <StatCard
              title="Bank Visits"
              value={stats.pendingVisits}
              description="Visits pending"
              icon={Building2}
            />

            <StatCard
              title="Documents"
              value={stats.pendingDocuments}
              description="Documents pending"
              icon={FileWarning}
            />
          </section>

          <section className="dashboard-two-column">
            <BankCases />
            <TimelineCases cases={visibleCases} />
          </section>

          <SalesTeam cases={visibleCases} currentUserId={currentUserId} />

          <HighLiabilityCases cases={visibleCases} />

          <BankVisitCases cases={visibleCases} />

          <section className="dashboard-two-column">
            <Notifications
              notifications={notificationItems}
              unreadCount={unreadCount}
              onMarkRead={markNotificationRead}
            />
            <RecentActivities />
          </section>

          <PendingDocuments />

          <footer className="dashboard-footer">
            <span>Case Management Dashboard</span>
            <span>Last updated just now</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
