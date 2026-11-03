import { describe, expect, it } from "vitest";
import { Auth, Unauthorized } from "../src/auth.js";
import { verifyPassword } from "../src/security.js";
import { Client, harness } from "./helpers.js";

const EMAIL = "rehash@example.test";
const PASSWORD = "correct horse battery";

describe("password cost upgrades", () => {
  it("upgrades an older hash after correct sign-in, once", async () => {
    const h = harness();
    const account = await new Client(h.app).signUp(EMAIL, "Rehash example");
    const stored = () => h.control.get<{ secret: string }>(
      "SELECT secret FROM credentials WHERE user_id = ? AND kind = 'password'", account.userId,
    )!.secret;

    const original = stored();
    expect(original).toMatch(/^scrypt\$1024\$8\$1\$/);

    const auth = new Auth(h.control, { signup: "open", cost: { N: 2 ** 12, r: 8, p: 1 } });
    await expect(auth.signIn(EMAIL, "incorrect password")).rejects.toBeInstanceOf(Unauthorized);
    expect(stored()).toBe(original);

    expect(await auth.signIn(EMAIL, PASSWORD)).toMatchObject({ userId: account.userId });
    const updated = stored();
    expect(updated).not.toBe(original);
    expect(updated).toMatch(/^scrypt\$4096\$8\$1\$/);
    expect(await verifyPassword(PASSWORD, updated)).toBe(true);

    await auth.signIn(EMAIL, PASSWORD);
    expect(stored()).toBe(updated);
  });

  it("does not rehash on failed authentication with the new cost", async () => {
    const h = harness();
    const account = await new Client(h.app).signUp(EMAIL, "Rehash example");
    const stored = () => h.control.get<{ secret: string }>(
      "SELECT secret FROM credentials WHERE user_id = ? AND kind = 'password'", account.userId,
    )!.secret;
    const original = stored();
    const auth = new Auth(h.control, { signup: "open", cost: { N: 2 ** 12, r: 8, p: 1 } });

    await expect(auth.signIn(EMAIL, "wrong password")).rejects.toBeInstanceOf(Unauthorized);
    expect(stored()).toBe(original);
  });
});
