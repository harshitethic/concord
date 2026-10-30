# Adding a dashboard API call without type drift

Concord has hand-maintained wire interfaces: server responses are constructed in services/api/src/{api,concord}.ts, while the browser names them in apps/web/src/api.ts. They are not generated from a shared schema. A green TypeScript check does **not** prove that the HTTP body matches the browser interface.

**Rule:** apps/web/src/api.ts is the only module permitted to talk directly to the server. Screens import api<T>(), download(), and response types from there. Do not add fetch() in tabs or components.

## Worked example: hypothetical journal summary

1. Define or update the HTTP endpoint in services/api/src/api.ts. Verify session, workspace and, for a mutation, owner permission as appropriate. Return an explicit JSON shape with the intended field casing and null behavior.
2. Add the browser interface in apps/web/src/api.ts, or extend the existing domain type. Prefer specific unions and nullable fields over any/unknown placeholders.
3. In a per-asset view, fetch with api<JournalSummary>(`/assets/${asset.id}/journal-summary`) inside useLoad. Include asset.id in dependencies so data cannot carry over between assets.
4. Render first-load skeleton, subsequent request error, empty state and successful result explicitly. Do not conflate an empty list with a failed request.
5. Add service tests for authorization, status codes and JSON fields, then a web component test with vi.mock('./api') or the existing mock pattern. Assert actual request path and the rendered values.
6. Run pnpm build, pnpm test, pnpm typecheck and pnpm lint from the repository root. The core package must be built first because API tests resolve its dist folder.

## Wire-shape drift you must review

| Browser declaration | Server source | Current review concern |
| --- | --- | --- |
| Run.movement in apps/web/src/api.ts | Concord.reconcile in services/api/src/concord.ts | Server spreads result.summary and adds a matches array. Browser type declares from/to/events/entries/matched but does not declare matches; update or deliberately exclude it at the HTTP boundary. |
| RunSummary in apps/web/src/api.ts | Concord.runs and API list routes | Compare the keys and nullability in actual list response; a summary snapshot is **not** automatically the same shape as a full Run.summary. |
| Action and AssetSummary | Concord serialization and the /overview routes | Keep optional vs null and enum states in sync, especially scheduled/pending actions and indexing/ready assets. |
| Break and RunLine | Reconciliation and sign-off serialization | Check bigint conversion to decimal strings and any additional status/notes fields before coding the UI. |

## Response and error contracts

api<T>() handles JSON request bodies, same-origin credentials and workspace headers. It throws ApiError on failed responses, raises a global concord:unauthorized event on protected 401, and returns undefined for HTTP 204. Protected file exports must use download() for the same handling. See docs/web-errors.md for status-by-status behavior.

Never manually append x-concord-org in a component, bypass it, or retry a mutating request after a 409. A stale tab may be showing a different workspace. Use showOrg() as managed by the session layer.

## Minimal review checklist

- The server and browser type name every field returned, including nullable/optional and nested arrays.
- API and browser tests assert at least one representative complete JSON response, not only HTTP 200.
- Verify the behavior on missing session (401), wrong workspace context (409), invalid request (400) and a successful response.
- No new raw fetch() was introduced outside apps/web/src/api.ts.
- No floats were introduced for units; chain quantities remain decimal strings or bigint only on the core side.
- Include screenshots for visual changes and sanitize all fixtures to remove customer data.
