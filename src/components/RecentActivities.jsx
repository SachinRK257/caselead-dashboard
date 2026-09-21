import {
  Building2,
  Clock3,
  FileUp,
  RefreshCw,
  UserCheck,
} from "lucide-react";

import EmptyState from "./EmptyState";
import { getSalesperson } from "../utils/cases";
import { activities } from "../data/mockData";

const ICONS = {
  "Case allocated": UserCheck,
  "Bank visit completed": Building2,
  "Document uploaded": FileUp,
  "Status changed": RefreshCw,
  "Timeline updated": Clock3,
};

export default function RecentActivities() {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Recent Work</h2>
          <p>What was done lately</p>
        </div>

        <button type="button" className="text-button">
          View all
        </button>
      </div>

      <div className="activity-list">
        {activities.length === 0 ? (
          <EmptyState message="No activity recorded yet." />
        ) : (
          activities.map((activity) => {
            const Icon = ICONS[activity.action] ?? RefreshCw;
            const actor = getSalesperson(activity.userId);

            return (
              <div className="activity-item" key={activity.id}>
                <div className="activity-icon" aria-hidden="true">
                  <Icon size={17} />
                </div>

                <div className="activity-content">
                  <strong>{activity.action}</strong>
                  <span>
                    {activity.caseId} · by {actor?.name ?? "System"}
                  </span>
                </div>

                <time>{activity.time}</time>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
