/**
 * Utility functions for cleaning document names and formatting citations.
 */

export function cleanDocName(name) {
  if (!name || name === "None" || typeof name !== "string") return name || "Document";
  // Strip directory paths (both forward and back slashes)
  let clean = name.split(/[/\\]/).pop();
  // Strip standard UUID prefixes (e.g. 76a746f5-8320-4125-a126-9ec9384a21a4_ or similar)
  clean = clean.replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_+/, "");
  // Strip 32-37 char hex hashes
  clean = clean.replace(/^[0-9a-fA-F-]{32,37}_+/, "");
  clean = clean.replace(/^[0-9a-fA-F]{32}_+/, "");
  // Strip user ID / timestamp / index prefixes like user_1_ or 1234_uuid_ or 1708899999_
  clean = clean.replace(/^\d+_[a-f0-9-]+_+/, "");
  clean = clean.replace(/^\d{10,}_+/, "");
  return clean.trim() || name;
}

export function formatPage(page) {
  if (page == null || page === "") return "";
  return `page ${page}`;
}
