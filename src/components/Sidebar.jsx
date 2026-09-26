import { useEffect } from "react";
import { LayoutDashboard, X } from "lucide-react";

import { initialsOf } from "../utils/cases";

const NAV_ITEMS = [
  { id: "case-lead", label: "Case Lead", icon: LayoutDashboard },
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

        <p className="sidebar-label">DASHBOARD</p>
        <nav className="sidebar-nav">{NAV_ITEMS.map(renderNavItem)}</nav>

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

        </div>
      </aside>
    </>
  );
}
