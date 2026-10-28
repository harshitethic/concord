import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Addr } from "./ui";

const address = `G${"A".repeat(55)}`;
describe("audit print layout", () => {
  it("preserves the complete address in a dedicated printable node", () => {
    const { container } = render(<Addr value={address} />);
    const full = container.querySelector(".print-full-address");
    expect(full).toHaveTextContent(address);
    expect(screen.getByRole("button", { name: /GAAAA/ })).toBeInTheDocument();
  });
  it("includes the full contract value without relying on a hover tooltip", () => {
    const contract = `C${"B".repeat(55)}`;
    const { container } = render(<Addr value={contract} />);
    const full = container.querySelector(".print-full-address");
    expect(full).toHaveTextContent(contract);
    expect(full).toHaveClass("break-all");
  });
});
