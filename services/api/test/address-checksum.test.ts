import { describe, expect, it } from "vitest";
import { nativeToScVal, StrKey } from "@stellar/stellar-sdk";
import { decodeEvent, decodeEventDetailed } from "../src/chain.js";
import type { RawEvent } from "../src/chain.js";

const symbol = nativeToScVal("mint", { type: "symbol" }).toXDR("base64");
const amount = nativeToScVal(3n, { type: "i128" }).toXDR("base64");
const record = (candidate: string): RawEvent => ({
  id: "1", ledger: 1, ledgerClosedAt: "2026-10-31T00:00:00Z",
  contractId: "CONTRACT", txHash: "x",
  topic: [symbol, nativeToScVal(candidate).toXDR("base64")], value: amount,
});

describe("decoded Stellar StrKey address validation", () => {
  it("rejects the wrong length and invalid checksum", () => {
    for (const invalid of ["G" + "A".repeat(59), "G" + "A".repeat(55), "C" + "A".repeat(55), "M" + "A".repeat(68)]) {
      expect(decodeEvent(record(invalid))).toBeUndefined();
      expect(decodeEventDetailed(record(invalid)).malformed).toBe(true);
    }
  });
  it("accepts valid G, C, L, B, and 69-character M StrKeys", () => {
    const raw = Buffer.alloc(32, 3);
    const candidates = [
      StrKey.encodeEd25519PublicKey(raw),
      StrKey.encodeContract(raw),
      StrKey.encodeLiquidityPool(raw),
      StrKey.encodeClaimableBalance(Buffer.alloc(33, 0)),
      StrKey.encodeMed25519PublicKey(Buffer.alloc(40, 2)),
    ];
    for (const candidate of candidates) {
      expect(decodeEvent(record(candidate)), candidate).toMatchObject({ kind: "mint", to: candidate, amount: 3n });
    }
  });
});
