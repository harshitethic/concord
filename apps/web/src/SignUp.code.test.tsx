import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignUp } from "./Auth";
import { api } from "./api";

const mocks = vi.hoisted(() => ({
  cfg: { signup: "open", google: true, ephemeral: false, networks: ["mainnet"], defaultNetwork: "mainnet" },
  adopt: vi.fn(),
}));
vi.mock("./session", () => ({ useSession: () => ({ config: mocks.cfg, adopt: mocks.adopt, me: null }) }));
vi.mock("./api", () => ({ api: vi.fn() }));
beforeEach(() => { vi.clearAllMocks(); mocks.cfg.signup = "open"; vi.mocked(api).mockResolvedValue({} as never); });
async function fill() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Your name/), "Alex");
  await user.type(screen.getByLabelText("Work email"), "alex@example.com");
  await user.type(screen.getByLabelText(/Workspace name/), "Acme");
  await user.type(screen.getByLabelText("Password"), "passwordlong123");
  return user;
}
describe("code-only workspace sign-up", () => {
  it("omits code in open mode and enforces field max lengths", async () => {
    render(<SignUp />);
    const user = await fill();
    expect(screen.queryByLabelText("Sign-up code")).toBeNull();
    expect(screen.getByLabelText(/Your name/)).toHaveAttribute("maxlength", "80");
    expect(screen.getByLabelText(/Workspace name/)).toHaveAttribute("maxlength", "80");
    expect(screen.getByLabelText("Work email")).toHaveAttribute("type", "email");
    await user.click(screen.getByRole("button", { name: "Create workspace" }));
    await waitFor(() => expect(api).toHaveBeenCalledWith("/auth/signup", { body: {
      name: "Alex", email: "alex@example.com", orgName: "Acme", password: "passwordlong123",
    } }));
  });
  it("includes trimmed code in API payload and safely encodes OAuth link", async () => {
    mocks.cfg.signup = "code";
    render(<SignUp />);
    const code = screen.getByLabelText(/Sign-up code/);
    expect(code).toBeRequired();
    expect(screen.getByRole("link", { name: "Sign up with Google" })).toHaveAttribute("href", "/api/auth/google/start");
    const user = await fill();
    await user.type(code, "  ABC+&  ");
    expect(screen.getByRole("link", { name: "Sign up with Google" })).toHaveAttribute("href", "/api/auth/google/start?code=ABC%2B%26");
    await user.click(screen.getByRole("button", { name: "Create workspace" }));
    await waitFor(() => expect(api).toHaveBeenCalledWith("/auth/signup", { body: {
      name: "Alex", email: "alex@example.com", orgName: "Acme", password: "passwordlong123", code: "ABC+&",
    } }));
  });
});
