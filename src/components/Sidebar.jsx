import { useEffect } from "react";
import {
  Building2,
  CalendarClock,
  FileWarning,
  LayoutDashboard,
  LogOut,
  Scale,
  Settings,
  Users,
  X,
} from "lucide-react";

import { initialsOf } from "../utils/cases";

/* Ids double as route names; `counts` supplies the badge so it can never
   drift from the case list the way a hardcoded number does. */
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "cases", label: "All Cases", icon: Scale },
  { id: "deadlines", label: "Deadlines", icon: CalendarClock },
  { id: "bank-visits", label: "Bank Visits", icon: Building2 },
  { id: "documents", label: "Documents", icon: FileWarning },
  { id: "assign", label: "Assign Cases", icon: Users },
];

const SETTINGS_ITEMS = [{ id: "settings", label: "Settings", icon: Settings }];

export default function Sidebar({
  user,
  mobileOpen = false,
  onClose,
  activeItem = "dashboard",
  counts = {},
  onNavigate,
  onSignOut,
}) {
  // Escape is the expected way out of an overlay drawer.
  useEffect(() => {
    if (!mobileOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onClose]);

  function renderNavItem({ id, label, icon: Icon }) {
    const isActive = id === activeItem;
    const badge = counts[id];

    return (
      <button
        key={id}
        type="button"
        className={`nav-item ${isActive ? "active" : ""}`}
        aria-current={isActive ? "page" : undefined}
        onClick={() => {
          onNavigate?.(id);
          onClose?.();
        }}
      >
        <Icon size={18} />
        <span>{label}</span>
        {badge ? (
          <span className="nav-badge" aria-label={`${badge} pending`}>
            {badge}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          role="presentation"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-logo" aria-hidden="true">
              CL
            </div>
            <div>
              <h2>CaseLead</h2>
              <span>Case Management</span>
            </div>
          </div>

          <button
            type="button"
            className="mobile-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <p className="sidebar-label">MENU</p>
        <nav className="sidebar-nav">{NAV_ITEMS.map(renderNavItem)}</nav>

        <p className="sidebar-label">GENERAL</p>
        <nav className="sidebar-nav">{SETTINGS_ITEMS.map(renderNavItem)}</nav>

        <div className="sidebar-bottom">
          <div className="profile-card">
            <div className="avatar" aria-hidden="true">
              {initialsOf(user?.name)}
            </div>
            <div className="profile-info">
              <strong>{user?.name ?? "Guest"}</strong>
              <span>{user?.city ?? "Salesperson"}</span>
            </div>
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={() => {
              onSignOut?.();
              onClose?.();
            }}
          >
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
