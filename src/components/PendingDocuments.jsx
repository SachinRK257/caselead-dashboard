import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, FileText } from "lucide-react";

import EmptyState from "./EmptyState";
import { DOCUMENT_STATUS_LABELS, getSalesperson } from "../utils/cases";
import { humanizeEnum } from "../utils/format";
import { pendingDocuments } from "../data/mockData";

const COLUMN_COUNT = 7;

export default function PendingDocuments() {
  const [statusFilter, setStatusFilter] = useState("ALL");

  const rows = useMemo(() => {
    if (statusFilter === "ALL") return pendingDocuments;
    return pendingDocuments.filter((item) => item.status === statusFilter);
  }, [statusFilter]);

  return (
    <div className="panel full-panel">
      <div className="panel-header">
        <div>
          <h2>Pending Documents</h2>
          <p>Cases requiring additional information</p>
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          aria-label="Filter by document status"
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ALL">All Status</option>
          {Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Borrower</th>
              <th scope="col">Bank</th>
              <th scope="col">Missing Document</th>
              <th scope="col">Assigned To</th>
              <th scope="col">Pending Since</th>
              <th scope="col">Status</th>
              <th scope="col">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <EmptyState
                colSpan={COLUMN_COUNT}
                message="No documents match this filter."
              />
            ) : (
              rows.map((item) => {
                const isComplete = item.status === "DOCUMENTS_COMPLETE";
                const owner = getSalesperson(item.assignedTo);

                return (
                  <tr key={item.id}>
                    <td>
                      <div className="borrower">
                        <div className="small-avatar" aria-hidden="true">
                          {item.borrower.charAt(0)}
                        </div>
                        <strong>{item.borrower}</strong>
                      </div>
                    </td>

                    <td>{item.bank}</td>

                    <td>
                      <div className="missing-document">
                        <FileText size={15} aria-hidden="true" />
                        {item.document}
                      </div>
                    </td>

                    <td>
                      {owner ? (
                        <div className="assignee-cell">
                          <strong>{owner.name}</strong>
                          <small>{owner.city}</small>
                        </div>
                      ) : (
                        "Unassigned"
                      )}
                    </td>

                    <td>{item.pendingSince}</td>

                    <td>
                      <span
                        className={`document-status ${
                          isComplete ? "is-complete" : "is-pending"
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle2 size={14} aria-hidden="true" />
                        ) : (
                          <AlertCircle size={14} aria-hidden="true" />
                        )}
                        {DOCUMENT_STATUS_LABELS[item.status] ??
                          humanizeEnum(item.status)}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="update-button"
                        aria-label={`Update ${item.document} for ${item.borrower}`}
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
