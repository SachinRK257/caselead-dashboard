import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Prev / next across a paged list.
 *
 * It states the range as well as the page - "11–20 of 65" answers how much is
 * left, which a page number on its own does not. Both buttons stay in place at
 * the ends rather than disappearing, so the control does not move under the
 * pointer on the first or last page.
 */
export default function Pagination({ page, pageCount, total, perPage, onPage }) {
  if (total === 0) return null;

  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);

  return (
    <div className="pagination">
      <p className="pagination-range">
        Showing <strong>{first}–{last}</strong> of {total} cases
      </p>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-step"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft size={15} aria-hidden="true" />
          Previous
        </button>

        <span className="pagination-page">
          Page {page} of {pageCount}
        </span>

        <button
          type="button"
          className="pagination-step"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Next
          <ChevronRight size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
