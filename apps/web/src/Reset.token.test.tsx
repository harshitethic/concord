import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Reset } from "./Auth";
import { api } from "./api";

const mocks = vi.hoisted(() => ({ adopt: vi.fn(), me: null as null | object,
  cfg: { signup: "open", google: false, ephemeral: false, networks: ["mainnet"], defaultNetwork: "mainnet" },
}));
vi.mock("./session", () => ({ useSession: () => ({ config: mocks.cfg, adopt: mocks.adopt, me: mocks.me }) }));
vi.mock("./api", () => ({ api: vi.fn() }));
beforeEach(() => { vi.clearAllMocks(); mocks.me = null; location.hash = "#/reset/SECRET"; });
describe("bearer reset token form", () => {
  it("requires a new password of at least ten characters without revealing the token", async () => {
    render(<Reset token="SECRET" />);
    const field = screen.getByLabelText("New password");
    expect(field).toHaveAttribute("minlength", "10");
    expect(document.body).not.toHaveTextContent("SECRET");
    const user = userEvent.setup();
    await user.type(field, "short");
    await user.click(screen.getByRole("button", { name: "Set password and sign in" }));
    expect(api).not.toHaveBeenCalled();
  });
  it("submits token/password and allows successful adoption", async () => {
    const member = { user: { id: "u" }, org: { id: "org" } };
    vi.mocked(api).mockResolvedValue(member as never);
    const user = userEvent.setup();
    render(<Reset token="SECRET" />);
    await user.type(screen.getByLabelText("New password"), "abcdefghijklm");
    await user.click(screen.getByRole("button", { name: "Set password and sign in" }));
    await waitFor(() => expect(api).toHaveBeenCalledWith("/auth/reset", { body: { token: "SECRET", password: "abcdefghijklm" } }));
    expect(mocks.adopt).toHaveBeenCalledWith(member);
  });
  it("retains reset form and shows a denied/spent token error", async () => {
    vi.mocked(api).mockRejectedValue(new Error("This link has expired."));
    const user = userEvent.setup();
    render(<Reset token="SECRET" />);
    await user.type(screen.getByLabelText("New password"), "abcdefghijklm");
    await user.click(screen.getByRole("button", { name: "Set password and sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("This link has expired.");
    expect(location.hash).toBe("#/reset/SECRET");
    expect(screen.getByRole("button", { name: "Set password and sign in" })).toBeEnabled();
  });
});
