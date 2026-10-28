import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./ui";
import { buildDocumentTitle, useDocumentTitle } from "./title";

describe("dashboard test harness", () => {
  it("renders a Badge with accessible text", () => {
    render(<Badge tone="ok">Reconciled</Badge>);
    expect(screen.getByText("Reconciled")).toBeInTheDocument();
  });
});

function TitleHarness({ title }: { title: string }) {
  useDocumentTitle(title);
  return null;
}

describe("route-aware browser tab titles", () => {
  it("distinguishes routes, tabs and asset codes", () => {
    expect(buildDocumentTitle("All assets")).toBe("All assets - Concord");
    expect(buildDocumentTitle("Settings")).toBe("Settings - Concord");
    expect(buildDocumentTitle("Reconciliation", "BENJI")).toBe("Reconciliation - BENJI - Concord");
    expect(buildDocumentTitle("Holdings", "BENJI")).toBe("Holdings - BENJI - Concord");
    expect(buildDocumentTitle("Sign in")).toBe("Sign in - Concord");
  });

  it("prefixes positive open-break counts but not zero or invalid counts", () => {
    expect(buildDocumentTitle("Reconciliation", "BENJI", 3)).toBe("(3) Reconciliation - BENJI - Concord");
    expect(buildDocumentTitle("Reconciliation", "BENJI", 0)).toBe("Reconciliation - BENJI - Concord");
    expect(buildDocumentTitle("Reconciliation", "BENJI", Number.NaN)).toBe("Reconciliation - BENJI - Concord");
  });

  it("updates document.title on rerender and clears previous route context", () => {
    const ui = render(<TitleHarness title={buildDocumentTitle("Reconciliation", "BENJI", 3)} />);
    expect(document.title).toBe("(3) Reconciliation - BENJI - Concord");
    ui.rerender(<TitleHarness title={buildDocumentTitle("Sign in")} />);
    expect(document.title).toBe("Sign in - Concord");
  });
});
