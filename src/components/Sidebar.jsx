import { useEffect } from "react";
import { Gauge, LayoutDashboard, X } from "lucide-react";

import { initialsOf } from "../utils/cases";

/* Grouped rather than one flat list: the SARFAESI pages are three views of
   one run, and a heading says so without a word of explanation. */
const NAV_GROUPS = [
  {
    label: "CASE LEAD",
    items: [{ id: "case-lead", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "SARFAESI",
    items: [{ id: "sarfaesi", label: "Dashboard", icon: Gauge }],
  },
];

export default function Sidebar({
  user,
  mobileOpen = false,
  onClose,
  activeItem = "case-lead",
  counts = {},
  onNavigate,
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

        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="sidebar-label">{group.label}</p>
            <nav className="sidebar-nav">{group.items.map(renderNavItem)}</nav>
          </div>
        ))}

        <div className="sidebar-bottom">
          <div className="profile-card">
            <div className="avatar" aria-hidden="true">
              {initialsOf(user?.name)}
            </div>
            <div className="profile-info">
              <strong>{user?.name ?? "Guest"}</strong>
              <span>{user?.city ?? user?.region ?? "All regions"}</span>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
}
