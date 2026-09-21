import PendingDocuments from "../components/PendingDocuments";
import CaseTable from "../components/CaseTable";

/** The document queue, plus the cases those papers belong to. */
export default function DocumentsPage({ cases = [] }) {
  const waiting = cases.filter(
    (item) => item.documents === "DOCUMENTS_PENDING"
  );

  return (
    <>
      <PendingDocuments cases={cases} />

      <div className="panel full-panel">
        <div className="panel-header">
          <div>
            <h2>
              Cases waiting on papers
              <span className="count-chip">{waiting.length}</span>
            </h2>
            <p>These cannot move until the documents arrive</p>
          </div>
        </div>

        <CaseTable
          cases={waiting}
          emptyMessage="Every case has its papers."
        />
      </div>
    </>
  );
}
