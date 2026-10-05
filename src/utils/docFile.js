/**
 * The file behind an uploaded checklist item.
 *
 * There are no real uploads here - the app has no backend and no store - so a
 * file's details are derived from the owner and document ids rather than held
 * anywhere. That keeps them stable across renders and reloads, which a random
 * stand-in would not be: a viewer whose file size changes every time you open
 * it is worse than one that admits it is a sample.
 *
 * When uploads are real, this is the one function to replace.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function hash(text) {
  return [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 23);
}

/** "demand-notice-copy" from "Demand Notice Copy". */
function slug(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

/**
 * The owner's id as it can appear in a file name, with its case kept: "CL-1002"
 * is already fine, but an empanelment letter ref like "EMP/2024/SBO/0308"
 * carries path separators that no file name can hold.
 */
function stem(id) {
  return String(id)
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function describeFile(caseId, doc) {
  const h = hash(`${caseId}:${doc.id}`);

  const pages = (h % 6) + 1;
  const kind = h % 5 === 0 ? "JPG" : "PDF";
  const sizeKb = 120 + (h % 2400);

  const year = 2026;
  const month = (h >>> 3) % 12;
  const day = ((h >>> 7) % 27) + 1;

  return {
    name: `${stem(caseId)}-${slug(doc.label)}.${kind.toLowerCase()}`,
    kind,
    pages: kind === "PDF" ? pages : 1,
    size: sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`,
    uploadedOn: `${day} ${MONTHS[month]} ${year}`,
  };
}
