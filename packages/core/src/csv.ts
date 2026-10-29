/** Minimal RFC 4180 reader and writer. Registers arrive as CSV exports from TA systems. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let afterQuote = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          afterQuote = true;
        }
      } else {
        field += c;
      }
    } else if (afterQuote && (c === " " || c === "\t")) {
      // Ignore optional spaces after a closed quoted field.
    } else if (afterQuote && c !== "," && c !== "\n" && c !== "\r") {
      const lines = src.slice(0, i).split(/\r\n|\r|\n/);
      const column = lines[lines.length - 1]!.length + 1;
      throw new Error("unexpected character after closing quote at line " + lines.length + ", column " + column);
    } else if (c === '"' && field === "") {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
      afterQuote = false;
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      afterQuote = false;
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (quoted) throw new Error("unterminated quoted field");
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

export interface CsvTable {
  headers: string[];
  records: Array<{ line: number; values: Record<string, string> }>;
}

/** Parse with a header row. Header names are lower-cased and spaces become underscores. */
export function parseCsvTable(text: string): CsvTable {
  const rows = parseCsv(text);
  const head = rows[0];
  if (!head) throw new Error("empty CSV");
  const headers = head.map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_"));
  const seen = new Map<string, number>();
  headers.forEach((h, index) => {
    if (!h) return;
    const previous = seen.get(h);
    if (previous !== undefined) {
      throw new Error('duplicate column "' + h + '" (columns ' + previous + ' and ' + (index + 1) + ')');
    }
    seen.set(h, index + 1);
  });
  const records = rows.slice(1).map((r, i) => {
    // Untrusted header names must not inherit or mutate Object.prototype.
    const values: Record<string, string> = Object.create(null);
    headers.forEach((h, j) => {
      if (!h) return; // Empty header slots have no corresponding column name.
      values[h] = (r[j] ?? "").trim();
    });
    return { line: i + 2, values };
  });
  return { headers, records };
}

function escape(value: unknown): string {
  let s: string;
  if (value === null || value === undefined) {
    s = "";
  } else if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error("cannot export invalid Date to CSV");
    s = value.toISOString();
  } else if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("cannot export non-finite number to CSV");
    s = String(value);
  } else if (typeof value === "object") {
    throw new Error("cannot export object or array to CSV");
  } else {
    s = String(value);
  }
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export function toCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const lines = [headers.map(escape).join(",")];
  for (const r of rows) lines.push(headers.map((h) => escape(r[h])).join(","));
  return lines.join("\n") + "\n";
}


export type CsvByteEncoding = "utf-8" | "utf-16le" | "utf-16be" | "windows-1252";
export interface DecodedCsvBytes { text: string; encoding: CsvByteEncoding }

/** UTF-8 decoder that refuses malformed/overlong code points before legacy fallback. */
function strictUtf8(bytes: Uint8Array): string | undefined {
  const chars: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const first = bytes[i]!;
    if (first < 0x80) { chars.push(String.fromCharCode(first)); continue; }
    const size = first >= 0xc2 && first <= 0xdf ? 2 :
      first >= 0xe0 && first <= 0xef ? 3 :
      first >= 0xf0 && first <= 0xf4 ? 4 : 0;
    if (!size || i + size > bytes.length) return undefined;
    let scalar = first & (size === 2 ? 0x1f : size === 3 ? 0x0f : 0x07);
    for (let j = 1; j < size; j++) {
      const part = bytes[i + j]!;
      if ((part & 0xc0) !== 0x80) return undefined;
      scalar = (scalar << 6) | (part & 0x3f);
    }
    if ((size === 2 && scalar < 0x80) ||
        (size === 3 && scalar < 0x800) ||
        (size === 4 && scalar < 0x10000) ||
        (scalar >= 0xd800 && scalar <= 0xdfff) || scalar > 0x10ffff) return undefined;
    chars.push(String.fromCodePoint(scalar));
    i += size - 1;
  }
  return chars.join("");
}

function utf16(bytes: Uint8Array, offset: number, little: boolean): string {
  if ((bytes.length - offset) % 2 !== 0) throw new Error("UTF-16 CSV has an incomplete code unit");
  const chars: string[] = [];
  for (let i = offset; i < bytes.length; i += 2) {
    const code = little ? bytes[i]! | (bytes[i + 1]! << 8) : (bytes[i]! << 8) | bytes[i + 1]!;
    chars.push(String.fromCharCode(code));
  }
  return chars.join("");
}

const CP1252: readonly number[] = [
  0x20ac, 0x0081, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021,
  0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x008d, 0x017d, 0x008f,
  0x0090, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
  0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x009d, 0x017e, 0x0178,
];

function decode1252(bytes: Uint8Array): string {
  const chars: string[] = [];
  for (const byte of bytes) {
    chars.push(String.fromCodePoint(byte >= 0x80 && byte <= 0x9f ? CP1252[byte - 0x80]! : byte));
  }
  return chars.join("");
}

/**
 * Decode transfer-agent CSV bytes in UTF-8, BOM-marked UTF-16 or Windows-1252.
 * UTF-16 without a BOM is recognized when the ASCII header has alternating NULs.
 * No TextDecoder, filesystem APIs, external network access or floating-point decoding.
 */
export function decodeCsvBytes(bytes: Uint8Array): DecodedCsvBytes {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return { text: utf16(bytes, 2, true), encoding: "utf-16le" };
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return { text: utf16(bytes, 2, false), encoding: "utf-16be" };
  }
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    const text = strictUtf8(bytes.subarray(3));
    if (text === undefined) throw new Error("malformed UTF-8 CSV with BOM");
    return { text, encoding: "utf-8" };
  }
  const pairs = Math.min(Math.floor(bytes.length / 2), 64);
  if (pairs >= 4) {
    let evenNulls = 0;
    let oddNulls = 0;
    for (let i = 0; i < pairs; i++) {
      if (bytes[i * 2] === 0) evenNulls++;
      if (bytes[i * 2 + 1] === 0) oddNulls++;
    }
    if (oddNulls > pairs * 0.35 && evenNulls < pairs * 0.1) {
      return { text: utf16(bytes, 0, true), encoding: "utf-16le" };
    }
    if (evenNulls > pairs * 0.35 && oddNulls < pairs * 0.1) {
      return { text: utf16(bytes, 0, false), encoding: "utf-16be" };
    }
  }
  const utf8 = strictUtf8(bytes);
  if (utf8 !== undefined) return { text: utf8, encoding: "utf-8" };
  return { text: decode1252(bytes), encoding: "windows-1252" };
}
