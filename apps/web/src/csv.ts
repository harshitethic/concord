import type { Holdings } from "./api";

/** Quote every CSV cell and neutralise Excel/Sheets formula execution on untrusted ledger data. */
export function csvCell(value: string | number | boolean): string {
  const text = String(value);
  const escaped = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${escaped.replace(/"/g, '""')}"`;
}

export function serializeHoldingsCsv(holders: Holdings["holders"]): string {
  const header = ["Address", "Units", "Share (%)", "Status", "Off register"];
  const rows = holders.map((holder) => [
    holder.address, holder.units, holder.share.toFixed(2), holder.status ?? "Not seen", holder.ignored ? "Yes" : "No",
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function holdingsCsvFilename(code: string, asOf: string | null): string {
  const safeCode = code.replace(/[^a-z0-9_-]/gi, "-");
  const instant = asOf?.replace(/[^0-9]/g, "").slice(0, 14) ?? "latest";
  return `concord-${safeCode}-holdings-${instant}.csv`;
}

export function downloadCsv(content: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  try { a.click(); } finally {
    a.remove();
    // Wait for the browser's asynchronous download to start before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
