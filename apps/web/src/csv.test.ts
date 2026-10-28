import { describe, expect, it } from "vitest";
import { csvCell, holdingsCsvFilename, serializeHoldingsCsv } from "./csv";

describe("as-of holdings audit CSV", () => {
  it("quotes commas, quotes, newlines and blocks formula injection", () => {
    expect(csvCell('hello,"there"\nbye')).toBe('"hello,""there""\nbye"');
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('  +cmd')).toBe(`"'  +cmd"`);
    expect(csvCell('-2')).toBe(`"'-2"`);
    expect(csvCell('@foo')).toBe(`"'@foo"`);
    expect(csvCell('0.5')).toBe('"0.5"');
  });
  it("serializes all displayed columns in screen order", () => {
    const csv = serializeHoldingsCsv([
      { address: "G1", units: "120.5", share: 12.345, status: null, ignored: false },
      { address: '=2+3', units: '-10', share: 0, status: "frozen", ignored: true },
    ]);
    expect(csv).toBe('"Address","Units","Share (%)","Status","Off register"\r\n'+
      '"G1","120.5","12.35","Not seen","No"\r\n'+
      `"'=2+3","'-10","0.00","frozen","Yes"\r\n`);
  });
  it("produces safe filenames containing the displayed instant", () => {
    expect(holdingsCsvFilename('A/B', '2026-10-06T21:00:00.000Z')).toBe('concord-A-B-holdings-20261006210000.csv');
    expect(holdingsCsvFilename('USD', null)).toBe('concord-USD-holdings-latest.csv');
  });
});
