import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generatorVersion } from "../src/version.js";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };

describe("audit export generator provenance", () => {
  it("reads version from the package, not a hard-coded value", () => {
    expect(generatorVersion("")).toBe("concord/" + pkg.version);
  });
  it("adds only a validated short commit identifier", () => {
    expect(generatorVersion("0123456789abcdef")).toBe("concord/" + pkg.version + "+0123456");
    expect(generatorVersion("not-a-hash")).toBe("concord/" + pkg.version);
  });
});
