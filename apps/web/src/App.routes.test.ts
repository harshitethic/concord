import { describe, expect, it } from "vitest";
import { parseRoute } from "./App";

describe("dashboard route parsing", () => {
  it("shows a not-found page rather than silently rendering an overview", () => {
    expect(parseRoute("#/nope").page).toBe("notfound");
    expect(parseRoute("#/a").page).toBe("notfound");
    expect(parseRoute("#/unknown/deep").page).toBe("notfound");
    expect(parseRoute("#/").page).toBe("home");
  });
  it("marks unknown asset tabs for canonical replacement", () => {
    expect(parseRoute("#/a/STELLAR123/typo")).toMatchObject({
      page: "asset", assetId: "STELLAR123", tab: "reconciliation", invalidTab: true,
    });
    expect(parseRoute("#/a/STELLAR123/holdings")).toMatchObject({
      page: "asset", assetId: "STELLAR123", tab: "holdings",
    });
    expect(parseRoute("#/a/STELLAR123/reconciliation").invalidTab).toBeUndefined();
  });
  it("preserves invite and reset tokens and sign-in routes", () => {
    expect(parseRoute("#/invite/abc").token).toBe("abc");
    expect(parseRoute("#/reset/def").token).toBe("def");
    expect(parseRoute("#/signin?error=google_exists").query.get("error")).toBe("google_exists");
  });
});
