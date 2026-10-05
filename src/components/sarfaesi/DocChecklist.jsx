import { useState } from "react";
import { CalendarClock, Check, Eye } from "lucide-react";

import DocViewer from "./DocViewer";
import { DOC_OWNER, STAGE_DOCS } from "../../data/sarfaesiDocs";
import { uploadedDocs } from "../../utils/sarfaesi";

/**
 * One case's checklist for the stage it is at.
 *
 * Everything is listed, uploaded or not, rather than only what is missing: a
 * checklist you can see the whole of tells you how much is left, and the
 * groups say who you have to go to for it.
 *
 * A group may number its items where the checklist itself is numbered - the
 * Section 14 list is referred to by item number, so dropping the numbers would
 * make the screen harder to talk about than the paper it came from.
 *
 * Where a step names who it belongs to, that is shown next to it: at physical
 * possession most of what holds a case up is waiting on somebody outside the
 * agency, and "Pending" on its own does not say who to chase.
 */
/** A step is done when its own file is in, or when every paper in it is. */
function isDone(doc, have) {
  return doc.items
    ? doc.items.every((sub) => have.has(sub.id))
    : have.has(doc.id);
}

export default function DocChecklist({ item, stage }) {
  const [viewing, setViewing] = useState(null);
  const have = uploadedDocs(item);
  const groups = STAGE_DOCS[stage] ?? [];

  return (
    <div className={`doc-checklist ${groups.length === 1 ? "is-single" : ""}`}>
      {groups.map((group) => {
        const done = group.docs.filter((doc) => isDone(doc, have)).length;

        return (
          <section key={group.title} className="doc-group">
            <h4>
              {group.title}
              <span className="doc-group-count">
                {done}/{group.docs.length}
              </span>
            </h4>

            <ul className={group.numbered ? "is-numbered" : ""}>
              {group.docs.map((doc, index) => {
                const uploaded = isDone(doc, have);

                return (
                  <li
                    key={doc.id ?? doc.label}
                    className={uploaded ? "is-uploaded" : "is-missing"}
                  >
                    {group.numbered && (
                      <span className="doc-index" aria-hidden="true">
                        {index + 1}
                      </span>
                    )}

                    <span className="doc-tick" aria-hidden="true">
                      {uploaded && <Check size={12} />}
                    </span>

                    <span className="doc-label">
                      <span className="doc-label-line">
                        {doc.label}
                        {doc.note && <small> — {doc.note}</small>}
                        {doc.owner && (
                          <span className={`doc-owner owner-${doc.owner.toLowerCase()}`}>
                            {DOC_OWNER[doc.owner]}
                          </span>
                        )}
                        {doc.critical && (
                          <span className="doc-critical">Critical Path</span>
                        )}
                      </span>

                      {/* The clock the step runs against, not time already
                          spent: nothing here tracks when a step was started. */}
                      {doc.sla && (
                        <span className="doc-sla">
                          <CalendarClock size={11} aria-hidden="true" />
                          {doc.sla}
                        </span>
                      )}

                      {/* A bundled step lists what it is waiting on rather
                          than saying only that it is not done. */}
                      {doc.items && (
                        <ol className="doc-subs">
                          {doc.items.map((sub) => (
                            <li
                              key={sub.id}
                              className={
                                have.has(sub.id) ? "is-uploaded" : "is-missing"
                              }
                            >
                              <span className="doc-tick" aria-hidden="true">
                                {have.has(sub.id) && <Check size={10} />}
                              </span>
                              <span>
                                {sub.label}
                                {sub.note && <small> — {sub.note}</small>}
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </span>

                    {/* Only an uploaded item has a single file to open; a
                        bundle reports how much of it is in. */}
                    {doc.items ? (
                      <span
                        className={`doc-state ${uploaded ? "is-done" : ""}`}
                      >
                        {doc.items.filter((sub) => have.has(sub.id)).length} of{" "}
                        {doc.items.length}
                      </span>
                    ) : uploaded ? (
                      <button
                        type="button"
                        className="doc-view"
                        onClick={() => setViewing(doc)}
                      >
                        <Eye size={13} aria-hidden="true" />
                        View
                      </button>
                    ) : (
                      <span className="doc-state">Pending</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {viewing && (
        <DocViewer item={item} doc={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
