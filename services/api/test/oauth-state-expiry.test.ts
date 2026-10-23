import { describe, expect, it } from "vitest";
import { Signer } from "../src/security.js";

describe("signed OAuth state expiry", () => {
  it("rejects a valid HMAC after the signed ten-minute lifetime, independent of the cookie", () => {
    let time = 1_800_000_000_000;
    const signer = new Signer(Buffer.alloc(32, 7), () => time);
    const state = { state: "random-oauth-state", nonce: "nonce", verifier: "verifier" };
    const sealed = signer.seal(state);
    expect(signer.open<typeof state>(sealed)).toEqual(state);
    time += 599_999;
    expect(signer.open<typeof state>(sealed)).toEqual(state);
    time += 1;
    expect(signer.open<typeof state>(sealed)).toBeUndefined();
  });

  it("still rejects tampering and unsigned legacy state without an expiry", () => {
    const signer = new Signer(Buffer.alloc(32, 7));
    const cookie = signer.seal({ state: "valid" });
    const [body, mac] = cookie.split(".");
    expect(signer.open(body + "." + mac?.replace(/^./, mac[0] === "a" ? "b" : "a"))).toBeUndefined();
    expect(signer.open("")).toBeUndefined();
  });
});
