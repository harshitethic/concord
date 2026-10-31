import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Overview } from "./Overview";
import { api } from "./api";
vi.mock("./api", () => ({ api: vi.fn() }));
afterEach(() => vi.clearAllMocks());
const a = "G" + "A".repeat(55), b = "G" + "B".repeat(55);
const candidates = [
  { asset: "USD:" + a, code: "USD", issuer: a, contractId: "", trustlines: 1520, authorizedUnits: "500", authRequired: true, authRevocable: true, clawbackEnabled: true },
  { asset: "USD:" + b, code: "USD", issuer: b, contractId: "", trustlines: 4, authorizedUnits: "8", authRequired: false, authRevocable: false, clawbackEnabled: false },
];
describe("asset issuer selection", () => {
  it("retains API order and issuer controls when selecting and going back", async () => {
    vi.mocked(api).mockResolvedValue(candidates as never);
    const user = userEvent.setup();
    render(<Overview assets={[]} network="mainnet" onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Watch asset" }));
    await user.type(screen.getByLabelText(/Asset on Mainnet/), "USD");
    await user.click(screen.getByRole("button", { name: "Find" }));
    const buttons = await screen.findAllByRole("button", { name: "Choose" });
    expect(buttons).toHaveLength(2);
    expect(screen.getByText("1,520")).toBeInTheDocument();
    expect(screen.getByText("Approval required")).toBeInTheDocument();
    expect(screen.getByText("Clawback")).toBeInTheDocument();
    expect(screen.getByText("No issuer controls")).toBeInTheDocument();
    await user.click(buttons[1]!);
    expect(screen.getByText("Issued by " + b)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Choose another" }));
    expect(screen.getByLabelText(/Asset on Mainnet/)).toHaveValue("USD");
  });
  it("shows an informative message when no issuer has the requested code", async () => {
    vi.mocked(api).mockResolvedValue([] as never);
    const user = userEvent.setup();
    render(<Overview assets={[]} network="mainnet" onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Watch asset" }));
    await user.type(screen.getByLabelText(/Asset on Mainnet/), "XUSD");
    await user.click(screen.getByRole("button", { name: "Find" }));
    expect(await screen.findByText(/No asset with the code XUSD exists on Mainnet/)).toBeInTheDocument();
  });
});
