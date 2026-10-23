/** Hide zero-only fractional digits without altering integral units. */
export function formatAuthorizedUnits(value: string): string {
  if (!value.includes(".")) return value;
  return value.replace(/0+$/, "").replace(/\.$/, "");
}
