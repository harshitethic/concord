import { useState } from "react";
import { api, type AssetSummary, type Candidate, type Network } from "./api";
import { Addr, Badge, Button, Empty, ErrorNote, Field, Section, StatusBadge, TableWrap, Units, inputClass, trimFractionalZeros, useAction, when } from "./ui";

const NETWORK_LABEL: Record<Network, string> = { mainnet: "Mainnet", testnet: "Testnet" };
const CONTRACT = /^C[A-Z2-7]{55}$/;
const CLASSIC = /^[A-Za-z0-9]{1,12}:G[A-Z2-7]{55}$/;
const CODE = /^[A-Za-z0-9]{1,12}$/;

function Flags({ c }: { c: Candidate }) {
  const flags = [c.authRequired && "Approval required", c.authRevocable && "Freezable", c.clawbackEnabled && "Clawback"].filter(Boolean);
  if (flags.length === 0) return <span className="text-xs text-muted">No issuer controls</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {flags.map((f) => (
        <Badge key={String(f)} tone="neutral">
          {f}
        </Badge>
      ))}
    </span>
  );
}

/** Find the asset on the ledger first, then say how to watch it. Nothing is watched on a guess. */
function WatchForm({ network, onDone }: { network: Network; onDone: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>();
  const [picked, setPicked] = useState<{ asset: string; title: string; detail: string }>();
  const [name, setName] = useState("");
  const [ignore, setIgnore] = useState("");
  const [decimals, setDecimals] = useState("");
  const [needDecimals, setNeedDecimals] = useState(false);
  const find = useAction();
  const watch = useAction();

  const search = () =>
    find.run(async () => {
      const q = query.trim();
      setCandidates(undefined);
      if (CONTRACT.test(q)) {
        setPicked({ asset: q, title: "Contract token", detail: q });
      } else if (CLASSIC.test(q)) {
        const [code, issuer] = q.split(":");
        setPicked({ asset: q, title: code!, detail: `Issued by ${issuer}` });
      } else if (CODE.test(q)) {
        setCandidates(await api<Candidate[]>(`/lookup?network=${network}&code=${encodeURIComponent(q)}`));
      } else {
        throw new Error("Enter an asset code of up to 12 letters or digits, CODE:ISSUER, or a contract id starting with C.");
      }
    });

  if (!picked) {
    return (
      <div className="flex flex-col gap-4 rounded border border-line bg-surface p-4">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <div className="min-w-[260px] flex-1">
            <Field
              label={`Asset on ${NETWORK_LABEL[network]}`}
              hint="An asset code such as BENJI, a full CODE:ISSUER, or the contract id of a SEP-41 token."
            >
              <input value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputClass} num`} spellCheck={false} required autoFocus />
            </Field>
          </div>
          <Button variant="primary" busy={find.busy} type="submit" className="mb-[22px]">
            {find.busy ? "Looking" : "Find"}
          </Button>
        </form>
        {find.error && <ErrorNote message={find.error} />}
        {candidates?.length === 0 && (
          <p className="text-[13px] text-muted">
            No asset with the code {query.trim().toUpperCase()} exists on {NETWORK_LABEL[network]}. Codes are case-sensitive.
            Check the spelling, or switch network at the top left.
          </p>
        )}
        {candidates && candidates.length > 0 && (
          <>
            <p className="text-[13px] text-muted">
              {candidates.length === 1 ? "One issuer uses" : `${candidates.length} issuers use`} this code. Anyone can
              issue an asset under any code, so pick by the issuer address your records hold.
            </p>
            <TableWrap>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Issuer</th>
                    <th className="r">Holders' trustlines</th>
                    <th className="r">Units authorised</th>
                    <th>Issuer controls</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.asset}>
                      <td>
                        <Addr value={c.issuer} />
                      </td>
                      <td className="r num">{c.trustlines.toLocaleString()}</td>
                      <td className="r">
                        <Units value={trimFractionalZeros(c.authorizedUnits)} />
                      </td>
                      <td>
                        <Flags c={c} />
                      </td>
                      <td className="r">
                        <Button onClick={() => setPicked({ asset: c.asset, title: c.code, detail: `Issued by ${c.issuer}` })}>Choose</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </>
        )}
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded border border-line bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void watch.run(async () => {
          const body: Record<string, unknown> = {
            network,
            asset: picked.asset,
            ignore: ignore.split(/[\s,]+/).filter(Boolean),
          };
          if (name.trim()) body.name = name.trim();
          if (needDecimals && decimals !== "") body.decimals = Number(decimals);
          try {
            const created = await api<AssetSummary>("/assets", { body });
            onDone(created.id);
          } catch (err) {
            // A contract that does not publish its decimals has to be told them.
            if (/decimals/.test((err as Error).message)) setNeedDecimals(true);
            throw err;
          }
        });
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {picked.title} <span className="font-normal text-muted">on {NETWORK_LABEL[network]}</span>
          </p>
          <p className="num break-all text-xs text-muted">{picked.detail}</p>
        </div>
        <Button onClick={() => setPicked(undefined)}>Choose another</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Display name" hint="Optional. How the asset is listed in this workspace.">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} maxLength={120} autoFocus />
        </Field>
        <Field
          label="Addresses kept off the register"
          hint="Optional. Issuer treasury or distribution accounts, separated by commas or new lines."
        >
          <input value={ignore} onChange={(e) => setIgnore(e.target.value)} className={`${inputClass} num`} spellCheck={false} />
        </Field>
      </div>
      {needDecimals && (
        <div className="max-w-xs">
          <Field label="Decimals" hint="This contract does not state how many decimal places its amounts carry.">
            <input
              value={decimals}
              onChange={(e) => setDecimals(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]{1,2}"
              className={`${inputClass} num`}
              required
            />
          </Field>
        </div>
      )}
      <p className="max-w-[70ch] text-[13px] text-muted">
        {CONTRACT.test(picked.asset)
          ? "If this contract belongs to a classic asset, Concord takes opening balances from Horizon. Otherwise holdings count only movements from the oldest ledger the network still keeps, about seven days back."
          : "Concord takes every holder's opening balance from Horizon, then follows the asset's events from that ledger on."}
      </p>
      {watch.error && <ErrorNote message={watch.error} />}
      <div>
        <Button variant="primary" busy={watch.busy} type="submit">
          {watch.busy ? "Checking the ledger" : "Watch asset"}
        </Button>
      </div>
    </form>
  );
}

type AssetSort = "breaks" | "indexed" | "units";
type SortDirection = "asc" | "desc";

function openBreaks(asset: AssetSummary): number {
  return asset.openBreaks.reconciliation + asset.openBreaks.controls + asset.openBreaks.actions;
}

/** Compare decimal quantities exactly, including supplies larger than Number.MAX_SAFE_INTEGER. */
function compareUnits(a: string, b: string): number {
  const parts = (v: string) => {
    const negative = v.startsWith("-");
    const [whole = "0", fraction = ""] = (negative ? v.slice(1) : v).split(".");
    return { negative, whole: whole.replace(/^0+(?=\d)/, ""), fraction: fraction.replace(/0+$/, "") };
  };
  const x = parts(a);
  const y = parts(b);
  if (x.negative !== y.negative) return x.negative ? -1 : 1;
  const sign = x.negative ? -1 : 1;
  if (x.whole.length !== y.whole.length) return Math.sign(x.whole.length - y.whole.length) * sign;
  if (x.whole !== y.whole) return (x.whole < y.whole ? -1 : 1) * sign;
  const length = Math.max(x.fraction.length, y.fraction.length);
  const xf = x.fraction.padEnd(length, "0");
  const yf = y.fraction.padEnd(length, "0");
  return (xf === yf ? 0 : xf < yf ? -1 : 1) * sign;
}

/** Stable sort: a refresh with new object instances must not reshuffle equal items. */
export function visibleAssets(assets: AssetSummary[], query: string, attention: boolean, sort: AssetSort, direction: SortDirection): AssetSummary[] {
  const term = query.trim().toLocaleLowerCase();
  return assets
    .map((asset, index) => ({ asset, index }))
    .filter(({ asset }) => (!term || `${asset.name} ${asset.code}`.toLocaleLowerCase().includes(term)) &&
      (!attention || Boolean(asset.syncError) || openBreaks(asset) > 0))
    .sort((a, b) => {
      const x = a.asset;
      const y = b.asset;
      let diff = 0;
      if (sort === "breaks") diff = openBreaks(x) - openBreaks(y);
      else if (sort === "units") diff = compareUnits(x.supply, y.supply);
      else diff = (x.syncedAt ?? "").localeCompare(y.syncedAt ?? "");
      return (direction === "asc" ? diff : -diff) || a.index - b.index;
    })
    .map(({ asset }) => asset);
}

export function Overview({ assets, network, onChange }: { assets: AssetSummary[]; network: Network; onChange: () => void }) {
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [attention, setAttention] = useState(false);
  const [sort, setSort] = useState<AssetSort>("breaks");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const filtered = visibleAssets(assets, query, attention, sort, direction);
  const changeSort = (key: AssetSort) => {
    if (key === sort) setDirection((current) => current === "asc" ? "desc" : "asc");
    else { setSort(key); setDirection("desc"); }
  };
  return (
    <div className="flex flex-col gap-8">
      <Section
        title="Watched assets"
        aside={
          <Button variant={adding ? "quiet" : "primary"} onClick={() => setAdding(!adding)}>
            {adding ? "Cancel" : "Watch asset"}
          </Button>
        }
      >
        {adding && (
          <WatchForm
            key={network}
            network={network}
            onDone={(id) => {
              setAdding(false);
              onChange();
              location.hash = `#/a/${id}/reconciliation`;
            }}
          />
        )}
        {assets.length === 0 && !adding ? (
          <Empty title={`Nothing is being watched on ${NETWORK_LABEL[network]}`}>
            Add a regulated asset to index its transfer, mint, burn, clawback and authorisation events. Then upload the
            register your transfer-agent system exports, and Concord lists where the two disagree. Concord only reads
            the ledger. It never holds keys.
          </Empty>
        ) : (
          assets.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex min-w-[190px] flex-1 flex-col gap-1 text-[13px]">
                  <span>Filter assets by name or code</span>
                  <input className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)} />
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                  <input type="checkbox" checked={attention} onChange={(e) => setAttention(e.target.checked)} />
                  Needs attention
                </label>
              </div>
              {filtered.length === 0 ? (
                <p role="status" className="text-[13px] text-muted">No assets match these filters.</p>
              ) : <TableWrap>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th className="r" aria-sort={sort === "units" ? direction === "asc" ? "ascending" : "descending" : "none"}>
                      <button type="button" onClick={() => changeSort("units")}>Units outstanding</button>
                    </th>
                    <th className="r">Holders</th>
                    <th aria-sort={sort === "indexed" ? direction === "asc" ? "ascending" : "descending" : "none"}>
                      <button type="button" onClick={() => changeSort("indexed")}>Indexed to</button>
                    </th>
                    <th>Last reconciliation</th>
                    <th className="r" aria-sort={sort === "breaks" ? direction === "asc" ? "ascending" : "descending" : "none"}>
                      <button type="button" onClick={() => changeSort("breaks")}>Open breaks</button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const open = openBreaks(a);
                    const indexing = a.state === "indexing";
                    return (
                      <tr key={a.id}>
                        <td>
                          <a href={`#/a/${a.id}/reconciliation`} className="font-medium hover:text-accent">
                            {a.name}
                          </a>
                          <span className="num block text-xs text-muted">{a.code}</span>
                        </td>
                        <td className="r">{indexing ? <span className="text-muted">…</span> : <Units value={a.supply} />}</td>
                        <td className="r num">{indexing ? "…" : a.holderCount.toLocaleString()}</td>
                        <td className="whitespace-nowrap text-[13px]">
                          <span className="flex items-center gap-2">
                            {indexing ? <Badge tone="neutral">Indexing</Badge> : when(a.syncedAt)}
                            {a.syncError && <Badge tone="warn">Failing</Badge>}
                          </span>
                        </td>
                        <td>
                          {a.lastRun ? (
                            <span className="flex items-center gap-2 text-[13px]">
                              <StatusBadge status={a.lastRun.status} />
                              {a.lastRun.asOf.slice(0, 10)}
                            </span>
                          ) : (
                            <span className="text-[13px] text-muted">No register yet</span>
                          )}
                        </td>
                        <td className="r">{open > 0 ? <Badge tone="bad">{open}</Badge> : <Badge tone="ok">0</Badge>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </TableWrap>}
            </div>
          )
        )}
      </Section>
    </div>
  );
}
