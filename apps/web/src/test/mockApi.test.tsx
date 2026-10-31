import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Overview } from "../Overview";
import { mockApi, type ApiFixture, type RecordedRequest } from "./mockApi";
let fixture: ApiFixture;
afterEach(() => { fixture?.assertNoUnexpected(); vi.unstubAllGlobals(); });
async function lookup(code: string, response: unknown) {
  fixture = mockApi({ ["GET /lookup?network=mainnet&code=" + code]: response });
  const user = userEvent.setup();
  render(<Overview assets={[]} network="mainnet" onChange={vi.fn()} />);
  await user.click(screen.getByRole("button", { name: "Watch asset" }));
  await user.type(screen.getByLabelText(/Asset on Mainnet/), code);
  await user.click(screen.getByRole("button", { name: "Find" }));
}
describe("mockApi drives real dashboard components with typed routes", () => {
  it("shows an empty lookup response", async () => {
    await lookup("ABC", []);
    expect(await screen.findByText(/No asset with the code ABC exists/)).toBeInTheDocument();
    expect(fixture.requests).toHaveLength(1);
    expect(fixture.requests[0]!.method).toBe("GET");
  });
  it("renders a candidate supplied by a route handler", async () => {
    const issuer = "G" + "A".repeat(55);
    await lookup("USD", [{ asset: "USD:" + issuer, code: "USD", issuer, contractId: "",
      trustlines: 1234, authorizedUnits: "0", authRequired: false, authRevocable: false, clawbackEnabled: false }]);
    expect(await screen.findByText("1,234")).toBeInTheDocument();
    expect(fixture.requests[0]!.path).toBe("/lookup?network=mainnet&code=USD");
  });
  it("records request headers and supports computed route responses", async () => {
    fixture = mockApi({ "GET /lookup?network=mainnet&code=ABC": (request: RecordedRequest) => {
      expect(request.headers.get("content-type")).toBeNull();
      return [];
    } });
    const user = userEvent.setup();
    render(<Overview assets={[]} network="mainnet" onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Watch asset" }));
    await user.type(screen.getByLabelText(/Asset on Mainnet/), "ABC");
    await user.click(screen.getByRole("button", { name: "Find" }));
    await waitFor(() => expect(fixture.requests).toHaveLength(1));
    expect(fixture.requests[0]!.headers.get("x-concord-org")).toBeNull();
  });
  it("records unmatched routes and fails the test when checked", async () => {
    fixture = mockApi({});
    await fetch("/api/not-registered");
    expect(fixture.unexpected).toEqual(["GET /not-registered"]);
    expect(() => fixture.assertNoUnexpected()).toThrow(/Unexpected API request/);
    fixture = mockApi({});
  });
});
