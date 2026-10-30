import { describe, expect, it } from "vitest";
import { registerSourceName } from "../src/cli-source.js";

describe("register CLI source metadata", () => {
  it("omits the user's local directory and preserves only the basename", () => {
    expect(registerSourceName("/home/alice/Desktop/clients/register.csv")).toBe("register.csv");
    expect(registerSourceName("/private/tmp/客户登记.csv")).toBe("客户登记.csv");
    expect(registerSourceName("relative/reports/register.csv")).toBe("register.csv");
    expect(registerSourceName("register.csv")).toBe("register.csv");
  });

  it("does not leak Windows directory paths when the CLI is used cross-platform", () => {
    expect(registerSourceName("C:\\Users\\Alice\\Documents\\clients\\register.csv")).toBe("register.csv");
    expect(registerSourceName("\\\\server\\share\\clients\\holdings.csv")).toBe("holdings.csv");
  });
});
