import { describe, expect, it } from "vitest";
import { decodeCsvBytes, parseCsvTable } from "../src/csv.js";
describe("CSV byte encoding detection", () => {
  it("decodes Excel UTF-16LE and UTF-16BE files with BOM", () => {
    const le = new Uint8Array([0xff,0xfe,0x69,0,0x64,0,0x2c,0,0x6e,0,0x61,0,0x6d,0,0x65,0,0x0a,0,0x31,0,0x2c,0,0xe9,0,0x0a,0]);
    const be = new Uint8Array([0xfe,0xff,0,0x69,0,0x64,0,0x2c,0,0x6e,0,0x61,0,0x6d,0,0x65,0,0x0a,0,0x31,0,0x2c,0,0xe9,0,0x0a]);
    for (const [bytes, encoding] of [[le,"utf-16le"],[be,"utf-16be"]] as const) {
      const decoded = decodeCsvBytes(bytes);
      expect(decoded.encoding).toBe(encoding);
      expect(parseCsvTable(decoded.text).records[0]?.values.name).toBe("é");
    }
  });
  it("decodes a valid UTF-8 BOM and accepts an unmarked UTF-8 accent", () => {
    expect(decodeCsvBytes(new Uint8Array([0xef,0xbb,0xbf,0x69,0x64]))).toEqual({ encoding:"utf-8", text:"id" });
    expect(decodeCsvBytes(new Uint8Array([0x4b,0xc3,0xbc,0x63,0x68,0x65])).text).toBe("Küche");
  });
  it("falls back to Windows-1252 for invalid UTF-8 bytes, preserving accents and the euro sign", () => {
    const decoded = decodeCsvBytes(new Uint8Array([0x43,0x61,0x66,0xe9,0x2c,0x80]));
    expect(decoded).toEqual({ encoding:"windows-1252", text:"Café,€" });
  });
  it("recognizes UTF-16 without BOM when ASCII headers contain alternating NULs", () => {
    const decoded = decodeCsvBytes(new Uint8Array([0x68,0,0x6f,0,0x6c,0,0x64,0,0x65,0,0x72,0,0x5f,0,0x69,0,0x64,0]));
    expect(decoded).toEqual({ encoding:"utf-16le", text:"holder_id" });
  });
  it("refuses malformed UTF-8 with an explicit UTF-8 BOM", () => {
    expect(() => decodeCsvBytes(new Uint8Array([0xef,0xbb,0xbf,0xc0]))).toThrow(/malformed UTF-8/);
  });
});
