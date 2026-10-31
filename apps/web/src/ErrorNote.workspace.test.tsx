import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorNote } from "./ui";

describe("stale workspace recovery", () => {
  it.each([
    "This tab is showing a different workspace. Reload it.",
    "This browser tab is missing its workspace context. Reload it.",
  ])("offers a reload action for workspace conflicts", (message) => {
    render(<ErrorNote message={message} />);
    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(screen.getByRole("button", { name: "Reload this workspace" })).toBeInTheDocument();
  });
  it("does not offer a reload action for ordinary form and network errors", () => {
    const { rerender } = render(<ErrorNote message="This field is required." />);
    expect(screen.queryByRole("button", { name: /Reload this workspace/ })).toBeNull();
    rerender(<ErrorNote message="The server is not reachable." />);
    expect(screen.queryByRole("button", { name: /Reload this workspace/ })).toBeNull();
  });
});
