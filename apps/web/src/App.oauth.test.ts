import { describe, expect, it } from "vitest";
import { consumeGoogleError } from "./App";

describe("Google redirect feedback", () => {
  it("consumes the error query once, preserving unrelated fields", () => {
    const outcome = consumeGoogleError("#/signin?error=google_exists&next=abc");
    expect(outcome.cleanHash).toBe("#/signin?next=abc");
    expect(outcome.message).toBeTruthy();
    expect(consumeGoogleError(outcome.cleanHash!).message).toBeUndefined();
    expect(consumeGoogleError("#/signin").message).toBeUndefined();
  });
  it("does not strip unrelated hash parameters", () => {
    expect(consumeGoogleError("#/signup?next=hello")).toEqual({});
    expect(consumeGoogleError("#/signup?error=google_denied").cleanHash).toBe("#/signup");
  });
});
