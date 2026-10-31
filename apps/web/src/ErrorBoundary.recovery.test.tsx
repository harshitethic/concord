import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ui";

afterEach(() => vi.restoreAllMocks());
function Crash({ failing }: { failing: boolean }) {
  if (failing) throw new Error("boom");
  return <div>Recovered screen</div>;
}
describe("error boundary isolation and reset", () => {
  it("shows a safe error and reload control while leaving a sibling intact", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { rerender } = render(<div><span>Always visible</span><ErrorBoundary key="one"><Crash failing /></ErrorBoundary></div>);
    expect(screen.getByText("Always visible")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
    rerender(<div><span>Always visible</span><ErrorBoundary key="two"><Crash failing={false} /></ErrorBoundary></div>);
    expect(screen.getByText("Recovered screen")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Always visible")).toBeInTheDocument();
  });
});
