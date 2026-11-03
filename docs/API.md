# HTTP API errors and client responses

All JSON API routes are under `/api/`. Most application errors have a
stable envelope:

```
{"error":"Human-readable explanation"}
```

`services/api/src/api.ts` owns the shared exception-to-status mapping.
The explanatory text can change; clients should branch on status rather than
match a particular English sentence.

| HTTP | Source | Meaning / client action |
| --- | --- | --- |
| 400 | `Invalid` or `Rejected` | Validate data and show the specific message; no automatic retry |
| 401 | `Unauthorized` | Session absent/expired or invalid credentials; request sign-in |
| 403 | `Forbidden` or same-origin guard | Insufficient permissions or a request not from the dashboard; do not retry unchanged |
| 404 | `NotFound` | Requested resource is missing or not available in this workspace |
| 409 | `Conflict` | Stale workspace tab, existing account or conflicting state; refresh context |
| 413 | Request body limit | Reduce upload/body size; register/journal/instructions uploads have a 10 MiB limit |
| 429 | `TooMany` | Respect the `Retry-After` header (whole seconds) before another attempt |
| 502 | `ChainError` | The upstream Stellar data source failed; display a temporary error or retry cautiously |
| 500 | Unexpected internal error | Log an incident ID on the client side; server deliberately hides internal details |

On 429, for example:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 42
Content-Type: application/json

{"error":"Too many attempts. Try again in 42 seconds."}
```

On an unhandled exception, the server logs the original exception and
returns only:

```
{"error":"Something went wrong on the server."}
```

Some handlers (including OAuth starts and callbacks) redirect instead of
returning JSON. A successful sign-in also creates an HttpOnly session cookie;
the front end should not attempt to read it through JavaScript.

**Browser security:** mutations require an origin that matches
`CONCORD_PUBLIC_URL` (or the browser's `Sec-Fetch-Site: same-origin`).
Every workspace route also requires a session, and an out-of-date
`x-concord-org` header returns 409 rather than operating in the wrong
workspace. Responses set `Cache-Control: no-store`.
