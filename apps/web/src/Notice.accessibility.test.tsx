import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Notice } from "./ui";

describe("notice announcements", () => {
  it("makes dynamic warnings polite live regions", () => {
    const { rerender } = render(<Notice>Checking the index</Notice>);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    rerender(<Notice>Chain history is incomplete</Notice>);
    expect(screen.getByRole("status")).toHaveTextContent("Chain history is incomplete");
  });

  it("does not announce static practice-network banners repeatedly", () => {
    const { container, rerender } = render(<Notice live={false}>Testnet notice</Notice>);
    expect(screen.queryByRole("status")).toBeNull();
    expect(container.firstElementChild).not.toHaveAttribute("aria-live");
    rerender(<Notice live={false}>Testnet notice</Notice>);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
