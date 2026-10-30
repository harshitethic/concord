# Adding a dashboard asset tab

This is the wiring checklist for a new view inside an existing watched asset. An illustrative 'Journal' tab is used below; do not create a new tab unless the product needs it.

## Where the navigation lives

- apps/web/src/App.tsx owns the TABS array, TabKey union, useRoute hash parser, the active badge count, and the view's conditional render branch.
- apps/web/src/tabs contains the per-asset components, such as Holdings.tsx, Events.tsx and Export.tsx.
- apps/web/src/ui.tsx provides shared useLoad, useAction, Skeleton, Empty, ErrorNote, Section and TableWrap, plus safe formatting for money, addresses and times.
- apps/web/src/api.ts owns typed HTTP calls and download handling. Never call fetch() directly from a tab.

## Steps: a hypothetical Journal tab

1. Add apps/web/src/tabs/Journal.tsx exporting Journal({ asset }: { asset: AssetSummary }). Keep HTTP calls in api<T> imported from ../api.
2. Add ['journal', 'Journal'] to TABS in App.tsx. TabKey is derived from TABS, so any route parser and render logic must use the new key. Provide a label meaningful to someone who has not read the code.
3. Register the new render condition beside the existing Reconciliation/Holdings/Actions/Controls/Events/Export branches. Use `key={asset.id}` to force a clean remount after switching assets; do not reuse previous asset data.
4. Load with useLoad(() => api<JournalResponse>(`/assets/${asset.id}/journal`), [asset.id]). The dependency guarantees a fresh request when the asset changes. Define JournalResponse in api.ts, based on the actual server JSON response.
5. Render a skeleton when `loading && !data`, an ErrorNote when the request fails, an Empty state when the success response has no records, and a real table only for populated results. Provide no silently blank states.
6. If the tab needs a badge, extend the badge(asset, key) switch in App.tsx. A badge must show a real count from AssetSummary or a documented API field—not a fabricated number or arbitrary notification.
7. Add tests for direct hash navigation (`#/a/<assetId>/journal`), switching assets, loading/error/empty/full states, keyboard access, and no extra requests after unmount. Check the route parser for unknown tab fallback and canonical hash behavior.
8. Use when(iso) for timestamps, Units for exact quantity strings and Addr/Tx for account or transaction identifiers; do not stringify bigint with Number(). The rest of the UI should follow shared styling primitives.
9. Update a relevant user guide, then run the repository's build, unit tests, typecheck, lint and a manual mobile-width browser check. Check deep links on reload and navigation with the keyboard.

## Example loading skeleton

The code below is a pattern, not a runnable Journal implementation; replace the endpoint and response type with a real API contract:

    const { data, error, loading } = useLoad(
      () => api<JournalResponse>(`/assets/${asset.id}/journal`),
      [asset.id],
    );
    if (loading && !data) return <Skeleton rows={6} />;
    if (error) return <ErrorNote message={error} />;
    if (!data?.records.length) return <Empty title="No journal entries">Import a journal first.</Empty>;

## Common mistakes

- Adding a label to TABS but forgetting its conditional render branch.
- Using a transient row index as a key rather than the asset identifier.
- Sending an API call through fetch instead of api<T> (this skips session and x-concord-org handling).
- Treating errors as empty data, or making a hidden browser tab poll continuously.
- Reusing a view's local state after a workspace or asset switch.
- Rendering a custom clickable row instead of a semantic button or link for keyboard users.

See docs/contributing/web-dev.md for dev-server and browser smoke tests, and docs/ARCHITECTURE.md for the server/browser boundary.
