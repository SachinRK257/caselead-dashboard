import { useMemo } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Clock3,
  FileWarning,
} from "lucide-react";

import BankCases from "../components/BankCases";
import CaseAnalytics from "../components/CaseAnalytics";
import TodayFocus from "../components/TodayFocus";
import BankVisitCases from "../components/BankVisitCases";
import HighLiabilityCases from "../components/HighLiabilityCases";
import Notifications from "../components/Notifications";
import PendingDocuments from "../components/PendingDocuments";
import RecentActivities from "../components/RecentActivities";
import SalesTeam from "../components/SalesTeam";
import StatCard from "../components/StatCard";
import TimelineCases from "../components/TimelineCases";

import { bankData, currentUserId } from "../data/mockData";
import { isHighLiability } from "../utils/cases";
import { formatLongDate } from "../utils/format";
import { useSettings } from "../context/settingsCore";

export default function Dashboard({
  cases: visibleCases = [],
  allCases = [],
  currentUser,
  searchQuery = "",
  today,
  notificationItems = [],
  unreadCount = 0,
  onMarkNotificationRead,
}) {
  const settings = useSettings();
  const firstName = currentUser?.name.split(" ")[0] ?? "there";

  const stats = useMemo(() => {
    const count = (predicate) => visibleCases.filter(predicate).length;

    return {
      // The bank breakdown is the book of record for the portfolio size.
      totalCases: bankData.reduce((sum, bank) => sum + bank.count, 0),
      pendingAllocation: count(
        (item) => item.allocationStatus === "NOT_ALLOCATED"
      ),
      highLiability: count((item) =>
        isHighLiability(item, settings.highLiabilityThreshold)
      ),
      dueSoon: count((item) => item.timelineStatus === "DUE_SOON"),
      overdue: count((item) => item.timelineStatus === "OVERDUE"),
      pendingVisits: count((item) => item.bankVisit === "VISIT_PENDING"),
      pendingDocuments: count(
        (item) => item.documents === "DOCUMENTS_PENDING"
      ),
    };
  }, [visibleCases, settings.highLiabilityThreshold]);

  return (
    <>
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

      <TodayFocus cases={visibleCases} />

      <section className="stats-grid" aria-label="Case summary">
        <StatCard
          title="Total Cases"
          value={stats.totalCases}
          description="All your cases"
          icon={BriefcaseBusiness}
        />

        <StatCard
          title="Not Assigned"
          value={stats.pendingAllocation}
          description="No one assigned"
          icon={Clock3}
        />

        <StatCard
          title="Big Amount"
          value={stats.highLiability}
          description="Handle these first"
          icon={AlertTriangle}
        />

        <StatCard
          title="Due Soon"
          value={stats.dueSoon}
          description="Due within 7 days"
          icon={CalendarClock}
          className="warning-card"
        />

        <StatCard
          title="Overdue"
          value={stats.overdue}
          description="Past the deadline"
          icon={AlertTriangle}
          className="danger-card"
        />

        <StatCard
          title="Bank Visits"
          value={stats.pendingVisits}
          description="Still to visit"
          icon={Building2}
        />

        <StatCard
          title="Documents"
          value={stats.pendingDocuments}
          description="Papers to collect"
          icon={FileWarning}
        />
      </section>

      <section className="dashboard-two-column">
        <BankCases cases={visibleCases} />
        <TimelineCases cases={visibleCases} />
      </section>

      <SalesTeam cases={visibleCases} currentUserId={currentUserId} />

      <CaseAnalytics cases={visibleCases} />

      <HighLiabilityCases cases={visibleCases} />

      <BankVisitCases cases={visibleCases} />

      <section className="dashboard-two-column">
        <Notifications
          notifications={notificationItems}
          unreadCount={unreadCount}
          onMarkRead={onMarkNotificationRead}
        />
        <RecentActivities />
      </section>

      <PendingDocuments cases={visibleCases} />

    </>
  );
}
