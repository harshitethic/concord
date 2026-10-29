import { parseUnits, DEFAULT_DECIMALS } from "./amount.js";
import { parseCsvTable } from "./csv.js";

export type HolderStatus = "active" | "frozen";

/** One line of the official register: a beneficial holder and where their units sit on-chain. */
export interface RegisterPosition {
  holderId: string;
  holderName?: string;
  /** Stellar address. Several holders may share one (omnibus). Empty when not yet mapped. */
  account?: string;
  units: bigint;
  status?: HolderStatus;
}

export interface ParseIssue {
  line: number;
  message: string;
}

export interface ParsedRegister {
  positions: RegisterPosition[];
  issues: ParseIssue[];
  /** Every accepted duplicate row merged into an earlier holder position. */
  merged?: Array<{ holderId: string; line: number; policy: "sum" | "last" }>;
}
export interface RegisterDuplicateOptions { duplicates?: "reject" | "sum" | "last" }

const ALIASES: Record<string, string[]> = {
  holder_id: ["holder_id", "holder", "investor_id", "account_id", "id"],
  holder_name: ["holder_name", "name", "investor_name"],
  account: ["account", "address", "stellar_address", "wallet", "stellar_account"],
  units: ["units", "balance", "shares", "quantity", "holding"],
  status: ["status", "state"],
};

function pick(headers: string[], field: string): string | undefined {
  return ALIASES[field]!.find((a) => headers.includes(a));
}

function parseStatus(raw: string): HolderStatus | undefined {
  const s = raw.toLowerCase();
  if (s === "") return undefined;
  if (["active", "authorized", "authorised", "open"].includes(s)) return "active";
  if (["frozen", "restricted", "blocked", "suspended"].includes(s)) return "frozen";
  throw new Error(`unknown status "${raw}"`);
}

/** The register's columns as Concord names them, in the order a template lists them. */
export const REGISTER_COLUMNS = ["holder_id", "holder_name", "account", "units", "status"] as const;

/** Columns: holder_id, units, and optionally holder_name, account, status. */
export function parseRegisterCsv(text: string, decimals = DEFAULT_DECIMALS, options: RegisterDuplicateOptions = {}): ParsedRegister {
  const policy = options.duplicates ?? "reject";
  if (!["reject", "sum", "last"].includes(policy)) throw new Error("invalid duplicate holder policy");
  const seen = new Map<string, number>();
  const merged: NonNullable<ParsedRegister["merged"]> = [];
  const table = parseCsvTable(text);
  const idCol = pick(table.headers, "holder_id");
  const unitsCol = pick(table.headers, "units");
  if (!idCol || !unitsCol) {
    throw new Error("register CSV needs a holder_id column and a units column");
  }
  const nameCol = pick(table.headers, "holder_name");
  const accountCol = pick(table.headers, "account");
  const statusCol = pick(table.headers, "status");
  const positions: RegisterPosition[] = [];
  const issues: ParseIssue[] = [];
  for (const { line, values } of table.records) {
    try {
      const holderId = values[idCol]!;
      if (!holderId) throw new Error("missing holder_id");
      const position: RegisterPosition = { holderId, units: parseUnits(values[unitsCol]!, decimals) };
      if (position.units < 0n) throw new Error("negative units");
      if (nameCol && values[nameCol]) position.holderName = values[nameCol];
      if (accountCol && values[accountCol]) position.account = values[accountCol];
      if (statusCol) {
        const status = parseStatus(values[statusCol]!);
        if (status) position.status = status;
      }
      const previousIndex = seen.get(holderId);
      if (previousIndex !== undefined) {
        if (policy === "reject") throw new Error("duplicate holder_id " + holderId);
        const previous = positions[previousIndex]!;
        if (policy === "sum") {
          // Same holder split across lots is legitimate, but different accounts
          // or frozen states must not be silently combined in one position.
          if (previous.account && position.account && previous.account !== position.account) {
            throw new Error("conflicting account for duplicate holder_id " + holderId);
          }
          if (previous.status && position.status && previous.status !== position.status) {
            throw new Error("conflicting status for duplicate holder_id " + holderId);
          }
          previous.units += position.units;
          previous.account ??= position.account;
          previous.status ??= position.status;
          previous.holderName ??= position.holderName;
        } else {
          positions[previousIndex] = position;
        }
        merged.push({ holderId, line, policy });
        continue;
      }
      seen.set(holderId, positions.length);
      positions.push(position);
    } catch (err) {
      issues.push({ line, message: (err as Error).message });
    }
  }
  return { positions, issues, ...(merged.length > 0 ? { merged } : {}) };
}
