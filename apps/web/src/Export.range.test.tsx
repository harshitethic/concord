import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { download, type AssetSummary } from "./api";
import { Export } from "./tabs/Export";

vi.mock("./api", () => ({ download: vi.fn() }));
const asset = { id: "asset-one", code: "UNIT" } as unknown as AssetSummary;
beforeEach(() => {
  vi.mocked(download).mockReset();
  vi.mocked(download).mockResolvedValue(undefined);
});
describe("audit export time period", () => {
  it("rejects an inverted range and never requests an export", () => {
    const { container } = render(<Export asset={asset} />);
    const [from, to] = [...container.querySelectorAll<HTMLInputElement>("input[type=datetime-local]")];
    expect(from).toBeDefined();
    expect(to).toBeDefined();
    fireEvent.change(from!, { target: { value: "2026-10-31T19:00" } });
    fireEvent.change(to!, { target: { value: "2026-10-31T18:00" } });
    expect(screen.getByRole("alert")).toHaveTextContent(/Period from must be earlier/);
    expect(screen.getByRole("button", { name: /Download audit pack/ })).toBeDisabled();
    for (const button of screen.getAllByRole("button", { name: "CSV" })) expect(button).toBeDisabled();
    expect(download).not.toHaveBeenCalled();
  });
  it("allows equal timestamps and one-sided ranges", async () => {
    const { container } = render(<Export asset={asset} />);
    const [from, to] = [...container.querySelectorAll<HTMLInputElement>("input[type=datetime-local]")];
    expect(from).toBeDefined();
    expect(to).toBeDefined();
    fireEvent.change(from!, { target: { value: "2026-10-31T18:00" } });
    fireEvent.change(to!, { target: { value: "2026-10-31T18:00" } });
    const button = screen.getByRole("button", { name: /Download audit pack/ });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    expect(vi.mocked(download).mock.calls[0]![0]).toContain("from=");
    fireEvent.change(to!, { target: { value: "" } });
    expect(button).toBeEnabled();
  });
});
