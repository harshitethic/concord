import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("CLI runtime lifecycle", () => {
  it("closes the runtime before returning from normal and JSON commands", () => {
    const dir = mkdtempSync(join(tmpdir(), "concord-cli-cleanup-"));
    try {
      const root = new URL("../../../", import.meta.url);
      const tsx = new URL("../node_modules/.bin/tsx", import.meta.url);
      const cli = new URL("../src/cli.ts", import.meta.url);
      for (const args of [["orgs"], ["orgs", "--json"]]) {
        const result = spawnSync(tsx.pathname, [cli.pathname, ...args], {
          cwd: root.pathname,
          env: {
            ...process.env,
            CONCORD_DATA_DIR: dir,
            CONCORD_SYNC_INTERVAL: "0",
            CONCORD_SIGNUP: "open",
          },
          encoding: "utf8",
          timeout: 20_000,
        });
        expect(result.status, result.stderr).toBe(0);
        expect(existsSync(join(dir, "control.db"))).toBe(true);
        expect(readdirSync(dir).filter((name) => name.endsWith("-wal") || name.endsWith("-shm"))).toEqual([]);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
