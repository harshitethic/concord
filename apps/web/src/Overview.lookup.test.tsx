import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Overview } from "./Overview";
import { api } from "./api";
vi.mock("./api", () => ({ api: vi.fn() }));
afterEach(() => vi.clearAllMocks());
const open = async () => {
  const user = userEvent.setup();
  render(<Overview assets={[]} network="mainnet" onChange={vi.fn()} />);
  await user.click(screen.getByRole("button", { name: "Watch asset" }));
  return user;
};
describe("asset lookup rejects guesses", () => {
  it.each([
    ["C" + "A".repeat(55), "Contract token"],
    ["USDC:G" + "A".repeat(55), "USDC"],
  ])("recognizes a full asset identifier without searching %s", async (value, expected) => {
    const user = await open();
    await user.type(screen.getByLabelText(/Asset on Mainnet/), value);
    await user.click(screen.getByRole("button", { name: "Find" }));
    expect(await screen.findByText(expected)).toBeInTheDocument();
    expect(api).not.toHaveBeenCalled();
  });
  it("calls the ledger lookup for plain codes", async () => {
    vi.mocked(api).mockResolvedValue([] as never);
    const user = await open();
    await user.type(screen.getByLabelText(/Asset on Mainnet/), "BENJI");
    await user.click(screen.getByRole("button", { name: "Find" }));
    await waitFor(() => expect(api).toHaveBeenCalledWith("/lookup?network=mainnet&code=BENJI"));
  });
  it.each(["bad code!", "c" + "a".repeat(55)])("rejects malformed identifiers without a request", async (value) => {
    const user = await open();
    await user.type(screen.getByLabelText(/Asset on Mainnet/), value);
    await user.click(screen.getByRole("button", { name: "Find" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Enter an asset code/);
    expect(api).not.toHaveBeenCalled();
  });
});
