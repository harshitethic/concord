import { basename, win32 } from "node:path";

/** Never persist operator-local directories in registers or audit exports. */
export function registerSourceName(file: string): string {
  return win32.basename(basename(file));
}
