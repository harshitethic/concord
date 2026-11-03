# Rate limits and lockouts

These are current per-process fixed windows, verified against
`services/api/src/auth-api.ts`, `services/api/src/api.ts` and
`services/api/src/security.ts`. The limit keys are not IP-based for
every operation: some are per-user or per-email.

| Action | Key | Attempts | Window |
| --- | --- | ---: | --- |
| Sign-up | IP | 20 | 60 minutes |
| Sign-in | IP | 20 | 10 minutes |
| Failed sign-in from a single address | email + IP | 10 | 15 minutes |
| Failed sign-in across addresses | email | 50 | 15 minutes |
| Change password | user | 10 | 15 minutes |
| Create/accept invitation | IP | 20 | 10 minutes |
| Password reset | IP | 20 | 10 minutes |
| Google OAuth start/callback | IP | 30 | 10 minutes |
| Asset lookup | user | 30 | 60 seconds |
| Watch an asset | user | 20 | 10 minutes |
| Manual sync | user | 60 | 10 minutes |
| Rebuild history | user | 20 | 10 minutes |
| Reconcile | user | 20 | 10 minutes |

An error response returns HTTP 429 and a `Retry-After` header measured in
seconds. A successful sign-in clears that email's failed-sign-in counters,
not the IP's aggregate attempt counter. Password changes and expensive asset
operations are protected separately.

**Deployment implications:** `RateLimiter` stores counters in process
memory, not in SQLite or Redis. Restarting the server clears every counter.
Running multiple API processes splits the counters between workers, making
the effective protection less predictable; do not deploy multiple app
instances behind a load balancer and assume these limits remain global.
The same single-process assumption affects OAuth: its state-cookie signing
secret is not shared with another process.

`CONCORD_TRUST_PROXY` must match the number of trusted reverse proxies.
Trusting arbitrary forwarded-IP headers permits spoofing a new client key;
trusting too few proxies combines unrelated people under a shared address.
These limits are not a DDoS defense and should be supplemented by upstream
edge controls when exposed publicly.
