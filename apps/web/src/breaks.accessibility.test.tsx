import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BreakTable } from "./breaks";
import type { Break } from "./api";
vi.mock("./session", () => ({ useMe: () => ({ user: { name: "Reviewer", email: "r@example.org" } }) }));
const sample = (key: string, ref: string): Break => ({
  scope: "control", type: "UNINSTRUCTED_CONTROL", key, ref, severity: "high", fingerprint: key,
  message: `Instruction ${ref} missing`, status: "open", note: null, noteScope: "control", noteStale: false,
  noteAuthor: null, noteAt: null,
});
describe("break review button accessibility", () => {
  it("names each review by subject and links expanded state to its panel", async () => {
    const user = userEvent.setup();
    render(<BreakTable assetId="asset-a" breaks={[sample("k1","R-1"),sample("k2","R-2"),sample("k3","R-3")]} onChange={vi.fn()} />);
    const buttons = screen.getAllByRole("button", { name: /^Review / });
    expect(buttons).toHaveLength(3);
    expect(new Set(buttons.map(b => b.getAttribute("aria-label"))).size).toBe(3);
    for (const button of buttons) {
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(document.getElementById(button.getAttribute("aria-controls")!)).toHaveAttribute("hidden");
    }
    await user.click(buttons[1]!);
    const close = screen.getByRole("button", { name: /Close .*R-2/ });
    expect(close).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(close.getAttribute("aria-controls")!)).not.toHaveAttribute("hidden");
    await user.click(close);
    expect(screen.getByRole("button", { name: /Review .*R-2/ })).toHaveAttribute("aria-expanded", "false");
  });
});
