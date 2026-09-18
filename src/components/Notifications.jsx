import {
  Bell,
  Building2,
  CalendarClock,
  FileWarning,
  PlusCircle,
} from "lucide-react";

import EmptyState from "./EmptyState";

const ICONS = {
  NEW_CASE: PlusCircle,
  TIMELINE: CalendarClock,
  BANK_VISIT: Building2,
  DOCUMENT: FileWarning,
};

export default function Notifications({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Notifications</h2>
          <p>Important case updates</p>
        </div>

        <span className="notification-count">{unreadCount} New</span>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <EmptyState message="You're all caught up." />
        ) : (
          notifications.map((item) => {
            const Icon = ICONS[item.type] ?? Bell;

            return (
              <button
                type="button"
                className={`notification-item ${item.unread ? "unread" : ""}`}
                key={item.id}
                onClick={() => onMarkRead?.(item.id)}
              >
                <div className="notification-icon" aria-hidden="true">
                  <Icon size={17} />
                </div>

                <div className="notification-content">
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                  <span>{item.time}</span>
                </div>

                {item.unread && (
                  <span className="unread-dot" aria-label="Unread" />
                )}
              </button>
            );
          })
        )}
      </div>

      <button type="button" className="view-all-button">
        View all notifications
      </button>
    </div>
  );
}
