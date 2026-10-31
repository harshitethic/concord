// @ts-expect-error Web TS project deliberately excludes Node types; this test executes in Node via Vitest.
import { readFileSync } from "node:fs";
const css = readFileSync("src/index.css", "utf8");
import { describe, expect, it } from "vitest";


const palette = (source: string): Record<string, string> =>
  Object.fromEntries([...source.matchAll(/--([\w-]+):\s*(#[\da-fA-F]{6});/g)].map((x) => [x[1]!, x[2]!]));
const lightSource = css.slice(css.indexOf(":root {"), css.indexOf("@media (prefers-color-scheme: dark)"));
const darkSource = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"), css.indexOf("@theme inline"));
const themes = { light: palette(lightSource), dark: palette(darkSource) };
function luminance(hex: string): number {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = rgb.map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}
function contrast(a: string, b: string): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
describe("WCAG AA design token contrast", () => {
  it.each(Object.entries(themes))("%s text colors meet 4.5:1 against their actual backgrounds", (_name, values) => {
    const pairs: Array<[string, string, string]> = [
      ["body", "text", "bg"], ["muted text", "muted", "surface"],
      ["quiet control", "text", "surface"], ["warning badge", "warn", "warn-bg"],
      ["error badge", "bad", "bad-bg"], ["success badge", "ok", "ok-bg"],
      ["neutral badge", "muted", "sunken"], ["primary button", "accent-ink", "accent"],
    ];
    for (const [label, fg, bg] of pairs) {
      expect(values[fg], label + " missing foreground token").toBeDefined();
      expect(values[bg], label + " missing background token").toBeDefined();
      expect(contrast(values[fg]!, values[bg]!), label + " contrast " + fg + " on " + bg).toBeGreaterThanOrEqual(4.5);
    }
  });
});
