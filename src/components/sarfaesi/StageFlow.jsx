import { ChevronRight } from "lucide-react";

import { STAGE_LABELS, STAGE_ORDER, docCountFor } from "../../data/sarfaesiDocs";

/** What gets a case out of each stage and into the next. */
const GATE = {
  SYMBOLIC: "Possession notice served",
  SECTION_14: "Magistrate's order obtained",
  PHYSICAL: "Possession taken, file closed",
};

/**
 * The run as a pipeline rather than three separate counts.
 *
 * Three cards side by side say how many are at each stage; they do not say
 * that a case leaves one by entering the next, or what it has to do to get
 * there. The arrows and the gate under each stage are what turn a set of
 * figures into a workflow.
 *
 * Each stage states its document progress as a figure rather than as a bar:
 * three bars across three cards invited a comparison between stages that does
 * not mean anything, since each is a share of a different checklist.
 */
export default function StageFlow({ totals, progress, completed, onPick, focus }) {
  return (
    <ol className="stage-flow">
      {STAGE_ORDER.map((stage, index) => {
        const count = totals[stage] ?? 0;
        const pct = progress[stage] ?? 0;
        const isLast = index === STAGE_ORDER.length - 1;

        return (
          <li key={stage}>
            <button
              type="button"
              className={`stage-step ${focus === stage ? "is-picked" : ""}`}
              aria-pressed={focus === stage}
              onClick={() => onPick?.(stage)}
            >
              <span className="stage-step-top">
                <span className="stage-step-no" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="stage-step-name">{STAGE_LABELS[stage]}</span>
              </span>

              <span className="stage-step-count">
                {count}
                <small>
                  {count === 1 ? "case" : "cases"}
                  {isLast && completed > 0 && ` · ${completed} closed`}
                </small>
              </span>

              <span className="stage-step-meta">
                {pct}% of {docCountFor(stage)} documents · {GATE[stage]}
              </span>
            </button>

            {!isLast && (
              <ChevronRight
                className="stage-flow-arrow"
                size={20}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
