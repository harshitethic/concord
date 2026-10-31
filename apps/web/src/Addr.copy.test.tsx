import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Addr, NetworkContext } from "./ui";

afterEach(() => vi.restoreAllMocks());
const account = "G" + "A".repeat(55);
const contract = "C" + "A".repeat(55);
describe("address link and clipboard controls", () => {
  it.each([
    ["mainnet", account, "/explorer/public/account/"],
    ["testnet", account, "/explorer/testnet/account/"],
    ["mainnet", contract, "/explorer/public/contract/"],
  ] as const)("links %s %s to its explorer", (network, value, part) => {
    render(<NetworkContext.Provider value={network}><Addr value={value} /></NetworkContext.Provider>);
    expect(screen.getByRole("link")).toHaveAttribute("href", expect.stringContaining(part));
  });
  it("does not link a muxed account or arbitrary short holder ID; null shows none", () => {
    const { rerender } = render(<Addr value={"M" + "A".repeat(68)} />);
    expect(screen.queryByRole("link")).toBeNull();
    rerender(<Addr value="HOLDER-123" />);
    expect(screen.queryByRole("link")).toBeNull();
    rerender(<Addr value={null} />);
    expect(screen.getByText("none")).toBeInTheDocument();
  });
  it("copies with success and reports clipboard denial without crashing", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<Addr value={account} />);
    await user.click(screen.getByTitle(account + " (click to copy)"));
    expect(writeText).toHaveBeenCalledWith(account);
    writeText.mockRejectedValue(new Error("denied"));
    await user.click(screen.getByTitle(account + " (click to copy)"));
    expect(await screen.findByRole("status")).toHaveTextContent("Copy failed");
    expect(screen.getByTitle(account + " (click to copy)")).toBeInTheDocument();
  });
});
