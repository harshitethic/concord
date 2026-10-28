import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { Password, PasswordResetHelp } from "./Auth";

function PasswordHarness({ fresh = false }: { fresh?: boolean }) {
  const [value, setValue] = useState("");
  return <Password label="Password" fresh={fresh} value={value} onChange={setValue} />;
}

describe("Password field", () => {
  it("counts remaining characters for new passwords, clearing at ten", async () => {
    const user = userEvent.setup();
    render(<PasswordHarness fresh />);
    const field = screen.getByLabelText("Password");
    expect(field).toHaveAttribute("minlength", "10");
    expect(field).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByText("At least 10 characters.")).toBeInTheDocument();
    await user.type(field, "abc");
    expect(screen.getByText("7 more characters needed.")).toBeInTheDocument();
    await user.type(field, "defghij");
    expect(screen.queryByText("7 more characters needed.")).not.toBeInTheDocument();
    expect(screen.queryByText(/more characters needed/)).not.toBeInTheDocument();
  });

  it("does not require new-password length on an existing password", () => {
    render(<PasswordHarness />);
    const field = screen.getByLabelText("Password");
    expect(field).not.toHaveAttribute("minlength");
    expect(field).toHaveAttribute("autocomplete", "current-password");
    expect(screen.queryByText(/at least 10 characters/i)).not.toBeInTheDocument();
  });

  it("toggles visibility without changing entered text", async () => {
    const user = userEvent.setup();
    render(<PasswordHarness fresh />);
    const field = screen.getByLabelText("Password");
    await user.type(field, "long-enough-password");
    expect(field).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show" }));
    expect(field).toHaveAttribute("type", "text");
    expect(field).toHaveValue("long-enough-password");
    expect(screen.getByRole("button", { name: "Hide" })).not.toHaveAttribute("aria-pressed");
    await user.click(screen.getByRole("button", { name: "Hide" }));
    expect(field).toHaveAttribute("type", "password");
  });
});

describe("password visibility control", () => {
  it("uses a changing action label without contradictory pressed semantics", async () => {
    render(<Password label="Password" value="secret" onChange={vi.fn()} />);
    const show = screen.getByRole("button", { name: "Show" });
    expect(show).not.toHaveAttribute("aria-pressed");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    await userEvent.click(show);
    const hide = screen.getByRole("button", { name: "Hide" });
    expect(hide).not.toHaveAttribute("aria-pressed");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
  });
});


describe("operator-managed password reset guidance", () => {
  it("explains the operator-issued link in a focusable native disclosure", async () => {
    const user = userEvent.setup();
    render(<PasswordResetHelp />);
    const summary = screen.getByText("Forgot your password?");
    expect(summary.closest("details")).not.toHaveAttribute("open");
    summary.focus();
    expect(summary).toHaveFocus();
    await user.click(summary);
    expect(summary.closest("details")).toHaveAttribute("open");
    expect(screen.getByText(/does not email password resets/)).toBeInTheDocument();
    expect(screen.queryByText(/Operator contact:/)).not.toBeInTheDocument();
  });

  it("escapes optional contact text and links to the token-specific reset route", async () => {
    const user = userEvent.setup();
    render(<PasswordResetHelp contact={'<img src=x onerror=alert(1)>'} />);
    await user.click(screen.getByText("Forgot your password?"));
    expect(screen.getByText(/Operator contact:/)).toHaveTextContent('<img src=x onerror=alert(1)>');
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open password reset" })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Already have a reset token?"), "abc-123");
    expect(screen.getByRole("link", { name: "Open password reset" })).toHaveAttribute("href", "#/reset/abc-123");
  });
});
