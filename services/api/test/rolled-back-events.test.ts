import { describe, expect, it } from "vitest";
import { nativeToScVal, StrKey } from "@stellar/stellar-sdk";
import { decodeEvent, decodeEventDetailed } from "../src/chain.js";
import type { RawEvent } from "../src/chain.js";

const recipient = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 3));
const topic = (value: string) => nativeToScVal(value, { type: "symbol" }).toXDR("base64");
const address = nativeToScVal(recipient, { type: "address" }).toXDR("base64");
const value = nativeToScVal(5n, { type: "i128" }).toXDR("base64");
const record: RawEvent = {
  id: "001-002", ledger: 100, ledgerClosedAt: "2026-10-31T00:00:00Z", contractId: "CONTRACT",
  txHash: "abc123", topic: [topic("mint"), address], value,
};

describe("contract call rollback event handling", () => {
  it("ignores events explicitly reported from rolled-back subcalls without reporting corrupt XDR", () => {
    expect(decodeEvent({ ...record, inSuccessfulContractCall: false })).toBeUndefined();
    expect(decodeEventDetailed({ ...record, inSuccessfulContractCall: false })).toEqual({ malformed: false });
  });
  it("continues to decode successful and modern events whose deprecated flag is omitted", () => {
    expect(decodeEvent({ ...record, inSuccessfulContractCall: true })).toMatchObject({ kind: "mint", to: recipient, amount: 5n });
    expect(decodeEvent(record)).toMatchObject({ kind: "mint", to: recipient, amount: 5n });
  });
});
