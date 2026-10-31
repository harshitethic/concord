import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Overview } from "./Overview";
import { api } from "./api";
vi.mock("./api", () => ({ api: vi.fn() }));
afterEach(() => { vi.clearAllMocks(); location.hash = "#/"; });
const contract = "C" + "A".repeat(55);
describe("contract-token decimals follow-up", () => {
  it("asks for required decimals and retries with numeric decimals and split ignore list", async () => {
    vi.mocked(api).mockRejectedValueOnce(new Error("Please provide decimals for this contract."))
      .mockResolvedValueOnce({ id: contract } as never);
    const user = userEvent.setup();
    const changed = vi.fn();
    render(<Overview assets={[]} network="mainnet" onChange={changed} />);
    await user.click(screen.getByRole("button", { name: "Watch asset" }));
    await user.type(screen.getByLabelText(/Asset on Mainnet/), contract);
    await user.click(screen.getByRole("button", { name: "Find" }));
    await user.type(screen.getByLabelText(/Addresses kept off the register/), "G123, G456 G789");
    await user.click(screen.getByRole("button", { name: "Watch asset" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/decimals/);
    const decimals = screen.getByLabelText(/Decimals/);
    expect(decimals).toBeRequired();
    expect(decimals).toHaveAttribute("inputmode", "numeric");
    await user.type(decimals, "6");
    await user.click(screen.getByRole("button", { name: "Watch asset" }));
    await waitFor(() => expect(api).toHaveBeenCalledTimes(2));
    expect(api).toHaveBeenNthCalledWith(2, "/assets", { body: {
      network: "mainnet", asset: contract, ignore: ["G123", "G456", "G789"], decimals: 6,
    } });
    await waitFor(() => expect(location.hash).toBe("#/a/" + contract + "/reconciliation"));
    expect(changed).toHaveBeenCalledOnce();
  });
});
