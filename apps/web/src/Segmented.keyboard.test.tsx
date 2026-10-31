import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Segmented } from "./ui";

describe("segmented radio keyboard navigation", () => {
  it("updates selection on click, arrow keys, Home and End with one tab stop", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    function App() {
      const [selected, setSelected] = useState("mainnet");
      return <Segmented label="Network" value={selected} options={[
        { value: "mainnet", label: "Mainnet" }, { value: "testnet", label: "Testnet" },
      ]} onChange={value => { setSelected(value); onChange(value); }} />;
    }
    render(<App />);
    const group = screen.getByRole("radiogroup", { name: "Network" });
    const mainnet = screen.getByRole("radio", { name: "Mainnet" });
    const testnet = screen.getByRole("radio", { name: "Testnet" });
    expect(group).toContainElement(mainnet);
    expect(mainnet).toHaveAttribute("aria-checked", "true");
    expect(mainnet).toHaveAttribute("tabindex", "0");
    expect(testnet).toHaveAttribute("tabindex", "-1");
    mainnet.focus();
    await user.keyboard("{ArrowRight}");
    expect(testnet).toHaveFocus();
    expect(testnet).toHaveAttribute("aria-checked", "true");
    expect(mainnet).toHaveAttribute("tabindex", "-1");
    await user.keyboard("{Home}");
    expect(mainnet).toHaveFocus();
    await user.keyboard("{End}");
    expect(testnet).toHaveFocus();
    await user.click(mainnet);
    expect(onChange).toHaveBeenLastCalledWith("mainnet");
    expect(mainnet).toHaveAttribute("aria-checked", "true");
  });
});
