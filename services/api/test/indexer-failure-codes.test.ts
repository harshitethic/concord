import { afterEach, describe, expect, it, vi } from "vitest";
import { describeFailure, Invalid } from "../src/concord.js";

afterEach(() => vi.restoreAllMocks());
describe("indexer failure diagnostics", () => {
  it("reports a stable code without leaking raw database error content", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const locked = Object.assign(new Error("database is locked; secret location /home/alice/finance"), { code: "SQLITE_BUSY" });
    expect(describeFailure(locked)).toMatch(/^\[db_locked\]/);
    expect(describeFailure(locked)).not.toContain("/home/alice");
    expect(describeFailure(new Error("database or disk is full"))).toMatch(/^\[disk_full\]/);
    expect(log).toHaveBeenCalled();
  });
  it("preserves safe domain errors and classifies all other errors as internal", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(describeFailure(new Invalid("Bad asset input"))).toBe("Bad asset input");
    expect(describeFailure(new Error("private stack/path"))).toBe(
      "[internal] Indexing stopped unexpectedly. Check the server log.",
    );
    expect(describeFailure({ arbitrary: "object" })).toMatch(/^\[internal\]/);
  });
});
