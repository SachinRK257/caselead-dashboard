import { SearchX } from "lucide-react";

export default function EmptyState({
  message = "No cases match the current filters.",
  colSpan,
}) {
  const content = (
    <div className="empty-state">
      <SearchX size={22} />
      <p>{message}</p>
    </div>
  );

  // Inside a table an empty state has to live in a cell, not beside one.
  if (colSpan) {
    return (
      <tr className="empty-row">
        <td colSpan={colSpan}>{content}</td>
      </tr>
    );
  }

  return content;
}
