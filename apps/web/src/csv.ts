import type { Holdings } from "./api";

/** RFC 4180 escaping plus formula-injection protection for spreadsheet applications. */
export function csvCell(value: string): string {
  // Spreadsheet apps may ignore leading whitespace before a formula marker.
  const safe = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function serializeHoldingsCsv(holders: Holdings["holders"]): string {
  const header = ["Address", "Units", "Share", "Status", "Off register"];
  const rows = holders.map((holder) => [
    holder.address,
    holder.units,
    `${holder.share.toFixed(2)}%`,
    holder.status ?? "Not seen",
    holder.ignored ? "Yes" : "No",
  ]);
  return [...[header, ...rows].map((row) => row.map(csvCell).join(","))].join("\r\n") + "\r\n";
}

/** Download exactly the rows currently displayed, without sending account data elsewhere. */
export function downloadHoldingsCsv(holders: Holdings["holders"], asOf: string | null, assetCode: string): void {
  const body = serializeHoldingsCsv(holders);
  const blob = new Blob(["\uFEFF", body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const instant = (asOf ?? "latest-indexed").replace(/[^0-9A-Za-z_-]/g, "-");
  const code = assetCode.replace(/[^0-9A-Za-z_-]/g, "-");
  anchor.href = url;
  anchor.download = `${code}-holdings-${instant}.csv`;
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
