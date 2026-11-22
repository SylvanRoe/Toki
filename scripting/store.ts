import { TokiState, WidgetSnapshot, emptyState } from "./types"

// Toki keeps one JSON file in the App Group directory so the home-screen
// widget (a separate extension context) can read a de-identified snapshot.
const DIR = FileManager.appGroupDocumentsDirectory
const DATA_FILE = DIR + "/toki-state.json"
const SNAP_FILE = DIR + "/toki-widget.json"
const DAY = 86400000

export function loadState(): TokiState {
  try {
    if (!FileManager.existsSync(DATA_FILE)) return emptyState()
    const raw = FileManager.readAsStringSync(DATA_FILE)
    const d = JSON.parse(raw)
    return {
      identities: Array.isArray(d.identities) ? d.identities : [],
      accounts: Array.isArray(d.accounts) ? d.accounts : [],
      tokens: Array.isArray(d.tokens) ? d.tokens : [],
      deleted: d.deleted && typeof d.deleted === "object" ? d.deleted : {},
      demo: d.demo,
    }
  } catch {
    return emptyState()
  }
}

export function saveState(state: TokiState): void {
  FileManager.writeAsStringSync(DATA_FILE, JSON.stringify(state))
  writeSnapshot(state)
}

/** Write ONLY metadata — never secret values or full identity values. */
export function writeSnapshot(state: TokiState): WidgetSnapshot {
  const now = Date.now()
  const tokens = state.tokens
    .filter(t => !(state.deleted[t.id] >= (t.updatedAt || 0)))
    .map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      color: t.color,
      expiresAt: t.expiresAt,
    }))
  const soon = tokens.filter(t => t.expiresAt && t.expiresAt - now > 0 && t.expiresAt - now < 7 * DAY).length
  const snap: WidgetSnapshot = {
    v: 1,
    at: now,
    counts: {
      identities: state.identities.length,
      accounts: state.accounts.length,
      tokens: tokens.length,
    },
    tokens,
    soon,
  }
  FileManager.writeAsStringSync(SNAP_FILE, JSON.stringify(snap))
  return snap
}

/** Parse a web-exported Toki JSON payload (supports old Atlas backups). */
export function importPayload(raw: string): TokiState {
  const d = JSON.parse(raw)
  if (!Array.isArray(d.identities) || !Array.isArray(d.accounts)) throw new Error("不是 Toki 备份文件")
  return {
    identities: d.identities,
    accounts: d.accounts,
    tokens: Array.isArray(d.tokens) ? d.tokens : [],
    deleted: d.deleted && typeof d.deleted === "object" ? d.deleted : {},
  }
}

export function exportPayload(state: TokiState): string {
  return JSON.stringify({ app: "toki", version: 2, exportedAt: new Date().toISOString(), ...state }, null, 2)
}

export const PATHS = { DATA_FILE, SNAP_FILE }
