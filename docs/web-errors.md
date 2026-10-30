# How API errors reach the dashboard

Concord's API errors are defined in services/api/src/api.ts and apps/web/src/api.ts. All requests and downloads from React should flow through apps/web/src/api.ts; individual tab components must not call fetch directly.

## HTTP status, cause, and UI response

| Status | Server origin | What the dashboard should do |
| --- | --- | --- |
| 0 (browser only) | Network failure, no HTTP response | ApiError uses a generic connection message; show ErrorNote and keep entered form data. |
| 400 | Invalid or Rejected: bad fields, file contents, or missing required input | Show safe validation text near the form; do not retry unchanged requests. |
| 401 | Unauthorized: missing/expired session | Protected API calls dispatch the concord:unauthorized window event. SessionProvider handles the lost session; sign-in attempts do **not** dispatch it. |
| 403 | Forbidden: missing owner permission or unsafe cross-origin mutation | Display the server's safe denial; do not request owner-level actions from a member account. |
| 404 | NotFound: missing workspace resource | Show inline error; asset pages may offer a link to All assets. |
| 409 | Conflict: x-concord-org disagrees with the active workspace | Tell the user to reload or switch back; never replay a mutation against a different workspace automatically. |
| 413 | Upload/bodyLimit rejected an oversized request | Show upload size error and keep the rest of the form. Limits vary by route (16 KiB auth, 128 KiB normal, 10 MiB upload). |
| 429 | TooMany: rate limiter | Display the rejection. The server sets Retry-After, but the current browser client does not automatically parse it or retry. |
| 502 | ChainError: upstream Stellar source unavailable or invalid | Display safe chain error and allow later retry. Never treat this as an accounting value. |
| 500 | Unexpected server failure | Only the generic 'Something went wrong on the server.' is sent. Read server logs for the original exception. |

## Request lifecycle

1. api<T>(path, init) sends same-origin cookies and attaches x-concord-org from showOrg. A body is JSON-encoded with Content-Type.
2. On a non-2xx response, failure() reads the JSON error field, otherwise supplies a short status-bearing fallback. The rejected promise is an ApiError(message, status).
3. On protected 401 responses, failure() dispatches concord:unauthorized; a 401 from sign-in, sign-up, or another auth entry flow does not revoke an otherwise valid session.
4. A form commonly wraps the promise in useAction().run(), which tracks busy and error. run() returns true or false, so callers should not assume an unsuccessful request threw out of the wrapper.
5. Components display ErrorNote near the affected control; never print exception stacks, raw query strings containing tokens, database paths, or response dumps into the page.
6. Downloads use download() in api.ts for exactly the same 401 and error handling; do not substitute a plain anchor for protected exports.

## Why x-concord-org matters

showOrg() records the workspace displayed by this browser tab. A workspace request carries that id in x-concord-org; the server checks it against the session's active org. Mutations from browser tabs must include the header. A missing/mismatched context yields 409 so an old tab cannot accidentally modify a different workspace. The right response is to reload or switch explicitly, never to drop the header to make a retry succeed.

## Safety of error text

Invalid, Rejected, NotFound, Forbidden, Conflict, and ChainError are deliberately handled by the server and are intended to have short, user-displayable messages. Unexpected exceptions are logged only on the server and replaced by a generic 500 response. Client-side ApiError messages should be shown as text through React components (not injected as HTML). Do not add stack traces or raw database driver messages to HTTP errors.

## Reviewer checklist

- Test a protected API 401 and ensure session state updates; an invalid password attempt must *not* trigger global sign-out.
- Test a stale-tab 409 without mutating the other workspace.
- Confirm 429 includes Retry-After; document any future client-side backoff changes.
- Test 413 and 502 without losing form input; verify 500 hides internal stack traces.
- Run the web and service unit tests. Review apps/web/src/api.auth.test.ts, apps/web/src/api.download.test.ts and services/api/test/service.test.ts for examples.
