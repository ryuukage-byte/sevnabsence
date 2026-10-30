// Cross-device sync between this browser's localStorage and Supabase (`app_records`).
//
// The services keep working synchronously against localStorage. This layer:
//   1. on start, pulls every record of the organisation and writes it into localStorage
//      (or, when the cloud is still empty, uploads what this device already has);
//   2. after every local save (`sevn:local-change`), diffs each collection by record id and
//      upserts / soft-deletes only what changed;
//   3. applies other devices' changes from Realtime, with polling as a fallback, and fires
//      `sevn:remote-change` so the services reload and the UI re-renders.
// Conflicts resolve per record, last write wins.
import { supabase, SUPABASE_CONFIGURED } from './supabase';

export type SyncStatus = 'disabled' | 'connecting' | 'online' | 'offline' | 'error';

const ORG_ID: string = import.meta.env.VITE_ORG_ID || 'default';
const TABLE = 'app_records';
const KAIGO_KEY = 'sevn_kaigo_state';
const POLL_MS = 15000;
const SYNCED_ONCE_KEY = 'sevn_cloud_synced_once';
const PUSH_DEBOUNCE_MS = 300;

interface Spec {
  name: string;
  key: string;    // localStorage key
  field?: string; // property inside an object stored at `key`
  idField?: string;
}

const ARRAY_SPECS: Spec[] = [
  { name: 'shifts', key: 'sevn_shifts' },
  { name: 'members', key: 'sevn_members' },
  { name: 'schedules', key: 'sevn_schedules' },
  { name: 'attendance', key: 'sevn_records' },
  { name: 'floors', key: KAIGO_KEY, field: 'floors' },
  { name: 'rooms', key: KAIGO_KEY, field: 'rooms' },
  { name: 'tasks', key: KAIGO_KEY, field: 'tasks' },
  { name: 'skills', key: KAIGO_KEY, field: 'skills' },
  { name: 'coverage', key: KAIGO_KEY, field: 'coverage' },
  { name: 'staff', key: KAIGO_KEY, field: 'staff', idField: 'member_id' },
  { name: 'offRequests', key: KAIGO_KEY, field: 'offRequests' },
  { name: 'leaveRequests', key: KAIGO_KEY, field: 'leaveRequests' },
  { name: 'messages', key: KAIGO_KEY, field: 'messages' }
];

// single values, stored in collection "meta" under their name
const META_SPECS: Spec[] = [
  { name: 'org', key: 'sevn_org' },
  { name: 'profile', key: KAIGO_KEY, field: 'profile' },
  { name: 'rules', key: KAIGO_KEY, field: 'rules' },
  { name: 'publishedMonths', key: KAIGO_KEY, field: 'publishedMonths' }
];

interface RemoteRow {
  org_id: string;
  collection: string;
  id: string;
  data: unknown;
  deleted: boolean;
  updated_at: string;
}

type Item = Record<string, unknown>;

const rowKey = (collection: string, id: string) => `${collection}|${id}`;

/** JSON with sorted object keys: Postgres jsonb reorders keys, so plain JSON.stringify can't compare. */
function canon(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v as Record<string, unknown>).sort().map((k) => [k, (v as Record<string, unknown>)[k]]))
      : v
  );
}

function readRoot(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function readValue(spec: Spec): unknown {
  const root = readRoot(spec.key);
  if (!spec.field) return root;
  return root && typeof root === 'object' ? (root as Record<string, unknown>)[spec.field] : undefined;
}

function writeValue(spec: Spec, value: unknown) {
  try {
    if (!spec.field) {
      localStorage.setItem(spec.key, JSON.stringify(value));
      return;
    }
    const root = (readRoot(spec.key) as Record<string, unknown>) || {};
    root[spec.field] = value;
    localStorage.setItem(spec.key, JSON.stringify(root));
  } catch {
    // quota errors: keep going, next pull repairs
  }
}

function readItems(spec: Spec): Item[] {
  const v = readValue(spec);
  return Array.isArray(v) ? (v as Item[]) : [];
}

/** Every record currently in localStorage, as rowKey -> JSON string. */
function snapshotLocal(): Map<string, string> {
  const snap = new Map<string, string>();
  for (const spec of ARRAY_SPECS) {
    const idField = spec.idField || 'id';
    for (const item of readItems(spec)) {
      const id = item?.[idField];
      if (typeof id === 'string' && id) snap.set(rowKey(spec.name, id), canon(item));
    }
  }
  for (const spec of META_SPECS) {
    const v = readValue(spec);
    if (v !== undefined) snap.set(rowKey('meta', spec.name), canon(v));
  }
  return snap;
}

function deviceId(): string {
  try {
    let id = localStorage.getItem('sevn_device_id');
    if (!id) {
      id = `dev_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('sevn_device_id', id);
    }
    return id;
  } catch {
    return 'dev_unknown';
  }
}

class CloudSync {
  private status: SyncStatus = SUPABASE_CONFIGURED ? 'connecting' : 'disabled';
  private message = SUPABASE_CONFIGURED ? 'Menghubungkan ke Supabase…' : 'Supabase belum dikonfigurasi — data hanya di perangkat ini.';
  private listeners = new Set<() => void>();
  /** Last version of each record known to equal the cloud. Only these can be deleted remotely. */
  private synced = new Map<string, string>();
  private hydrated = false;
  /** Local state at boot, and records edited locally before the first successful pull. */
  private boot = new Map<string, string>();
  private dirty = new Map<string, string | null>();
  private pushTimer: ReturnType<typeof setTimeout> | null = null;
  private pushing = false;
  private pushAgain = false;
  private lastSeen = '1970-01-01T00:00:00Z';
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastSyncAt: Date | null = null;
  private readonly device = deviceId();

  getStatus() {
    return { status: this.status, message: this.message, lastSyncAt: this.lastSyncAt, orgId: ORG_ID };
  }

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };

  private setStatus(status: SyncStatus, message: string) {
    this.status = status;
    this.message = message;
    this.listeners.forEach((l) => l());
  }

  /** Pull the organisation's data before the app renders. Never throws. */
  async init(timeoutMs = 3500): Promise<void> {
    if (!SUPABASE_CONFIGURED) return;
    this.boot = snapshotLocal();
    window.addEventListener('sevn:local-change', () => (this.hydrated ? this.schedulePush() : this.trackOfflineEdits()));
    window.addEventListener('online', () => void this.retry());
    const timeout = new Promise<void>((resolve) =>
      setTimeout(() => {
        if (!this.hydrated) this.setStatus('offline', 'Supabase tidak merespons — memakai data lokal, sinkron dimatikan sampai tersambung.');
        resolve();
      }, timeoutMs)
    );
    await Promise.race([this.hydrate(), timeout]);
  }

  /** Edits made before the cloud answered (e.g. kiosk booted offline) must survive the first pull. */
  private trackOfflineEdits() {
    const current = snapshotLocal();
    current.forEach((json, k) => {
      if (this.boot.get(k) !== json) this.dirty.set(k, json);
    });
    this.boot.forEach((_json, k) => {
      if (!current.has(k)) this.dirty.set(k, null);
    });
  }

  async retry() {
    if (!SUPABASE_CONFIGURED) return;
    if (this.hydrated) {
      await this.pull();
      await this.push();
      return;
    }
    this.setStatus('connecting', 'Menghubungkan ulang…');
    await this.hydrate();
  }

  private async fetchAll(): Promise<RemoteRow[]> {
    const rows: RemoteRow[] = [];
    const page = 1000;
    for (let from = 0; ; from += page) {
      const { data, error } = await supabase
        .from(TABLE)
        .select('org_id,collection,id,data,deleted,updated_at')
        .eq('org_id', ORG_ID)
        .order('collection')
        .order('id')
        .range(from, from + page - 1);
      if (error) throw error;
      rows.push(...((data as RemoteRow[]) || []));
      if (!data || data.length < page) break;
    }
    return rows;
  }

  private async hydrate() {
    try {
      const rows = await this.fetchAll();
      const live = rows.filter((r) => !r.deleted);
      rows.forEach((r) => this.bumpLastSeen(r.updated_at));

      if (live.length === 0) {
        // Empty cloud: this device seeds it with whatever it has.
        this.synced.clear();
        this.hydrated = true;
        await this.push();
      } else {
        this.replaceLocal(live);
        this.synced = new Map(live.map((r) => [rowKey(r.collection, r.id), canon(r.data)]));
        // A device that never synced only holds the built-in template: keep just its brand-new records.
        const trusted = localStorage.getItem(SYNCED_ONCE_KEY) === '1';
        this.dirty.forEach((json, k) => {
          if (!trusted && (json === null || this.synced.has(k))) return;
          this.writeRecord(k, json === null ? undefined : JSON.parse(json));
        });
        this.dirty.clear();
        this.hydrated = true;
        window.dispatchEvent(new Event('sevn:remote-change'));
        await this.push(); // sends offline edits, if any
      }
      try {
        localStorage.setItem(SYNCED_ONCE_KEY, '1');
      } catch {
        // ignore
      }
      this.lastSyncAt = new Date();
      this.setStatus('online', 'Tersinkron dengan Supabase. Perubahan dari perangkat lain masuk otomatis.');
      this.startLive();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String((err as { message?: string })?.message || err);
      const missingTable = /app_records|PGRST205|42P01/.test(msg);
      this.setStatus(
        'error',
        missingTable
          ? 'Tabel app_records belum ada. Jalankan supabase/migrations/20261028_app_records_sync.sql di SQL Editor.'
          : `Gagal sinkron: ${msg}. Memakai data lokal.`
      );
    }
  }

  /** Overwrite every synced collection in localStorage with the cloud copy. */
  private replaceLocal(rows: RemoteRow[]) {
    const byCollection = new Map<string, RemoteRow[]>();
    rows.forEach((r) => byCollection.set(r.collection, [...(byCollection.get(r.collection) || []), r]));
    for (const spec of ARRAY_SPECS) {
      writeValue(spec, (byCollection.get(spec.name) || []).map((r) => r.data));
    }
    const meta = byCollection.get('meta') || [];
    for (const spec of META_SPECS) {
      const row = meta.find((r) => r.id === spec.name);
      if (row) writeValue(spec, row.data);
    }
  }

  private bumpLastSeen(ts: string) {
    if (ts > this.lastSeen) this.lastSeen = ts;
  }

  // ---------- push ----------
  private schedulePush() {
    if (!this.hydrated) return;
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => void this.push(), PUSH_DEBOUNCE_MS);
  }

  private async push() {
    if (!this.hydrated) return;
    if (this.pushing) {
      this.pushAgain = true;
      return;
    }
    this.pushing = true;
    try {
      const current = snapshotLocal();
      const upserts: { org_id: string; collection: string; id: string; data: unknown; deleted: boolean; updated_by: string }[] = [];
      const sent = new Map<string, string | null>();
      current.forEach((json, k) => {
        if (this.synced.get(k) === json) return;
        const [collection, ...rest] = k.split('|');
        upserts.push({ org_id: ORG_ID, collection, id: rest.join('|'), data: JSON.parse(json), deleted: false, updated_by: this.device });
        sent.set(k, json);
      });
      this.synced.forEach((json, k) => {
        if (current.has(k)) return;
        const [collection, ...rest] = k.split('|');
        upserts.push({ org_id: ORG_ID, collection, id: rest.join('|'), data: JSON.parse(json), deleted: true, updated_by: this.device });
        sent.set(k, null);
      });
      for (let i = 0; i < upserts.length; i += 500) {
        const { error } = await supabase.from(TABLE).upsert(upserts.slice(i, i + 500), { onConflict: 'org_id,collection,id' });
        if (error) throw error;
      }
      sent.forEach((json, k) => (json === null ? this.synced.delete(k) : this.synced.set(k, json)));
      if (upserts.length) {
        this.lastSyncAt = new Date();
        this.setStatus('online', 'Tersinkron dengan Supabase. Perubahan dari perangkat lain masuk otomatis.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String((err as { message?: string })?.message || err);
      this.setStatus('offline', `Perubahan belum terkirim (${msg}). Akan dicoba lagi.`);
      setTimeout(() => this.schedulePush(), 5000);
    } finally {
      this.pushing = false;
      if (this.pushAgain) {
        this.pushAgain = false;
        this.schedulePush();
      }
    }
  }

  // ---------- pull ----------
  private startLive() {
    try {
      supabase
        .channel(`app_records_${ORG_ID}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: `org_id=eq.${ORG_ID}` }, (payload) => {
          const row = payload.new as RemoteRow | undefined;
          if (row && row.org_id === ORG_ID) this.applyRemote([row]);
        })
        .subscribe();
    } catch {
      // polling below still keeps devices in sync
    }
    if (!this.pollTimer) this.pollTimer = setInterval(() => void this.pull(), POLL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void this.pull();
    });
  }

  private async pull() {
    if (!this.hydrated) return;
    try {
      // 5 s overlap guards against rows committed slightly out of timestamp order
      const since = new Date(new Date(this.lastSeen).getTime() - 5000).toISOString();
      const { data, error } = await supabase
        .from(TABLE)
        .select('org_id,collection,id,data,deleted,updated_at')
        .eq('org_id', ORG_ID)
        .gt('updated_at', since)
        .order('updated_at')
        .limit(1000);
      if (error) throw error;
      this.applyRemote((data as RemoteRow[]) || []);
      if (this.status !== 'online') this.setStatus('online', 'Tersinkron dengan Supabase. Perubahan dari perangkat lain masuk otomatis.');
    } catch {
      if (this.status === 'online') this.setStatus('offline', 'Koneksi ke Supabase terputus — perubahan disimpan lokal dulu.');
    }
  }

  /** Write one record into localStorage; `data` undefined removes it. */
  private writeRecord(k: string, data: unknown) {
    const [collection, ...rest] = k.split('|');
    const id = rest.join('|');
    if (collection === 'meta') {
      const spec = META_SPECS.find((x) => x.name === id);
      if (spec && data !== undefined) writeValue(spec, data);
      return;
    }
    const spec = ARRAY_SPECS.find((x) => x.name === collection);
    if (!spec) return;
    const idField = spec.idField || 'id';
    const items = readItems(spec);
    const idx = items.findIndex((it) => it?.[idField] === id);
    if (data === undefined) {
      if (idx !== -1) items.splice(idx, 1);
    } else if (idx === -1) {
      items.push(data as Item);
    } else {
      items[idx] = data as Item;
    }
    writeValue(spec, items);
  }

  private applyRemote(rows: RemoteRow[]) {
    let changed = false;
    for (const row of rows) {
      this.bumpLastSeen(row.updated_at);
      const k = rowKey(row.collection, row.id);
      const json = row.deleted ? null : canon(row.data);
      if ((this.synced.get(k) ?? null) === json) continue;
      this.writeRecord(k, row.deleted ? undefined : row.data);
      if (json === null) this.synced.delete(k);
      else this.synced.set(k, json);
      changed = true;
    }
    if (changed) {
      this.lastSyncAt = new Date();
      window.dispatchEvent(new Event('sevn:remote-change'));
      this.listeners.forEach((l) => l());
    }
  }
}

export const cloudSync = new CloudSync();
