import { readFileSync } from "node:fs";

interface PackageMetadata { version: string }

/** Read the package's own version, which is shipped alongside dist in Docker. */
const packageVersion = (JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as PackageMetadata).version;

export function generatorVersion(commit = process.env.CONCORD_BUILD_SHA): string {
  const short = commit && /^[0-9a-f]{7,40}$/i.test(commit) ? `+${commit.slice(0, 7).toLowerCase()}` : "";
  return `concord/${packageVersion}${short}`;
}
