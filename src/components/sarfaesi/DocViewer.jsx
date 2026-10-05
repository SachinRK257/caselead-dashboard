import { useEffect } from "react";
import { FileText, X } from "lucide-react";

import { describeFile } from "../../utils/docFile";

/**
 * The uploaded document, opened.
 *
 * No file is actually stored, so this shows the document's details and a
 * stand-in page rather than pretending to render something it does not have.
 * Saying so on the page is the point: a blank viewer that looks like a failed
 * load would send someone chasing a bug that is not there.
 *
 * It opens a case's checklist documents and the lender panel's empanelment
 * letters alike; `title` and `subtitle` are how the latter names itself, since
 * a letter belongs to a lender rather than to a borrower.
 */
export default function DocViewer({ item, doc, title, subtitle, onClose }) {
  // Escape is the expected way out of a dialog.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const file = describeFile(item.id, doc);

  return (
    <div
      className="doc-viewer-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        className="doc-viewer"
        role="dialog"
        aria-modal="true"
        aria-label={title ?? doc.label}
      >
        <header className="doc-viewer-head">
          <div>
            <h3>{title ?? doc.label}</h3>
            {/* A case names itself by id, borrower and lender; anything else
                that opens here says who it belongs to in its own terms. */}
            <p>{subtitle ?? `${item.id} · ${item.borrower} · ${item.bank}`}</p>
          </div>

          <button
            type="button"
            className="doc-viewer-close"
            onClick={onClose}
            aria-label="Close document"
          >
            <X size={18} />
          </button>
        </header>

        <dl className="doc-viewer-meta">
          <div>
            <dt>File</dt>
            <dd>{file.name}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>
              {file.kind} · {file.pages} {file.pages === 1 ? "page" : "pages"}
            </dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{file.size}</dd>
          </div>
          <div>
            <dt>Uploaded</dt>
            <dd>{file.uploadedOn}</dd>
          </div>
        </dl>

        <div className="doc-viewer-page">
          <FileText size={34} aria-hidden="true" />
          <strong>{file.name}</strong>
          <p>
            No file is stored in this build, so there is nothing to render. The
            viewer opens here once uploads are wired to the API.
          </p>
          {doc.note && <span className="doc-viewer-note">{doc.note}</span>}
        </div>
      </div>
    </div>
  );
}
