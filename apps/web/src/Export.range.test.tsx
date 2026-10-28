import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Export } from "./tabs/Export";
import { download, type AssetSummary } from "./api";
vi.mock("./api", async (importOriginal) => ({ ...(await importOriginal<typeof import("./api")>()), download:vi.fn().mockResolvedValue(undefined) }));
const asset = { id:"a", code:"AAA", state:"ready" } as AssetSummary;
describe("audit export period validation", () => {
  it("blocks inverted bounds but permits equal or missing endpoints", async () => {
    const user = userEvent.setup();
    render(<Export asset={asset} />);
    fireEvent.change(screen.getByLabelText(/Period from/), { target:{value:"2026-10-07T10:00"} });
    fireEvent.change(screen.getByLabelText(/Period to/), { target:{value:"2026-10-06T10:00"} });
    expect(screen.getByText("Period end must not be before the start.")).toBeInTheDocument();
    const pack=screen.getByRole("button", {name:/Download audit pack/});
    expect(pack).toBeDisabled();
    for(const csv of screen.getAllByRole("button",{name:"CSV"})) expect(csv).toBeDisabled();
    await user.click(pack);
    expect(download).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Period to/), { target:{value:"2026-10-07T10:00"} });
    expect(pack).toBeEnabled();
    await user.click(pack);
    expect(download).toHaveBeenCalledOnce();
    fireEvent.change(screen.getByLabelText(/Period from/), { target:{value:""} });
    expect(pack).toBeEnabled();
  });
});
