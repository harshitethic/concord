import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignIn } from "./Auth";
import { api } from "./api";

const mocks = vi.hoisted(() => ({
  cfg: { signup: "open", google: false, ephemeral: false, networks: ["mainnet"], defaultNetwork: "mainnet" },
  adopt: vi.fn(),
}));
vi.mock("./session", () => ({ useSession: () => ({ config: mocks.cfg, adopt: mocks.adopt, me: null }) }));
vi.mock("./api", () => ({ api: vi.fn() }));
beforeEach(() => { vi.clearAllMocks(); mocks.cfg.google = false; });
const member = { user: { id: "u" }, org: { id: "org-1" } };
describe("sign-in form", () => {
  it("sends email/password, disables while pending and adopts the returned session", async () => {
    let resolve!: (v: typeof member) => void;
    vi.mocked(api).mockImplementation(() => new Promise<typeof member>(done => { resolve = done; }) as never);
    const user = userEvent.setup();
    render(<SignIn />);
    await user.type(screen.getByLabelText("Email"), "name@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(api).toHaveBeenCalledWith("/auth/signin", { body: { email: "name@example.com", password: "secret123" } });
    expect(screen.getByRole("button", { name: "Signing in" })).toBeDisabled();
    resolve(member);
    await waitFor(() => expect(mocks.adopt).toHaveBeenCalledWith(member));
    expect(await screen.findByRole("button", { name: "Sign in" })).toBeEnabled();
  });
  it("shows a server error, permits retry and respects Google config", async () => {
    vi.mocked(api).mockRejectedValue(new Error("Wrong email or password."));
    const user = userEvent.setup();
    const { rerender } = render(<SignIn error="Google sign-in cancelled." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Google sign-in cancelled.");
    expect(screen.queryByRole("link", { name: /Continue with Google/ })).toBeNull();
    mocks.cfg.google = true;
    rerender(<SignIn />);
    expect(screen.getByRole("link", { name: "Continue with Google" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Email"), "name@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Wrong email or password.");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });
});
