import { afterEach, describe, expect, it, vi } from "vitest";
import { Client, harness } from "./helpers.js";

afterEach(() => vi.unstubAllEnvs());

describe("pending invitation cap", () => {
  it("limits distinct active invites but permits replacement and revocation", async () => {
    vi.stubEnv("CONCORD_MAX_INVITES", "2");
    const h = harness();
    const owner = await new Client(h.app).signUp("owner@example.test", "Limited");
    const create = async (email: string) =>
      owner.call("/api/org/invites", { body: { email, role: "member" } });
    expect((await create("a@example.test")).status).toBe(201);
    expect((await create("b@example.test")).status).toBe(201);
    const blocked = await create("c@example.test");
    expect(blocked.status).toBe(400);
    expect(await blocked.json()).toEqual({ error: "A workspace can have at most 2 pending invitations." });
    expect((await create("a@example.test")).status).toBe(201);
    const invites = await owner.json<{ invites: Array<{ id: string; email: string }> }>("/api/org/members");
    expect(invites.invites).toHaveLength(2);
    const id = invites.invites.find((invite) => invite.email === "a@example.test")!.id;
    expect((await owner.call("/api/org/invites/" + id, { method: "DELETE" })).status).toBe(200);
    expect((await create("c@example.test")).status).toBe(201);
  });
});
