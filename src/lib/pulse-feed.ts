import { publicClient } from "@/lib/arkiv";
import { eq } from "@arkiv-network/sdk/query";

export type UpdateRecord = {
  key: string;
  note: string;
  status: string;
  creator: string;
  tx: string;
  createdAt?: string;
};

export type AlertRecord = {
  key: string;
  title: string;
  type: string;
  severity: number;
  status: string;
  region: string;
  description: string;
  creator: string;
  tx: string;
  createdAt?: string;
  expiresAt?: string;
  updates: UpdateRecord[];
};

function getAttrValue(attr: any): any {
  if (attr == null) return null;
  if (typeof attr === "object" && "value" in attr) return attr.value;
  return attr;
}

export function readAttrs(entity: any) {
  const attrs: Record<string, any> = {};
  if (Array.isArray(entity.attributes)) {
    for (const attr of entity.attributes) {
      const name = attr?.name || attr?.key;
      if (name) attrs[name] = getAttrValue(attr);
    }
  } else if (entity.attributes && typeof entity.attributes === "object") {
    for (const [key, val] of Object.entries(entity.attributes)) {
      attrs[key] = getAttrValue(val);
    }
  }
  return attrs;
}

export function readNote(entity: any) {
  try {
    if (typeof entity.toJson === "function") {
      const payload = entity.toJson();
      return String(payload?.description || payload?.note || "");
    }
  } catch {
    return "";
  }
  return "";
}

/** Human label for entity expiry (Arkiv BTL). */
export function formatExpiresIn(expiresAt?: string): string | null {
  if (!expiresAt) return null;
  const end = Number(expiresAt);
  if (!Number.isFinite(end) || end <= 0) return null;
  // expiresAt may be unix seconds or ms
  const endMs = end < 1e12 ? end * 1000 : end;
  const ms = endMs - Date.now();
  if (ms <= 0) return "expired";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) {
    const mins = Math.max(1, Math.floor(ms / 60_000));
    return `expires in ${mins}m`;
  }
  if (hours < 48) return `expires in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `expires in ${days}d`;
}

export async function loadPulseFeed(limit = 60): Promise<AlertRecord[]> {
  const result = await publicClient
    .select({
      key: true,
      attributes: true,
      payload: true,
      creator: true,
      createdAt: true,
      expiresAt: true,
    })
    .where(eq("app", "pulse"))
    .limit(limit)
    .fetch();

  const updatesByParent = new Map<string, UpdateRecord[]>();
  const alerts: AlertRecord[] = [];

  for (const entity of result.entities as any[]) {
    const attrs = readAttrs(entity);
    const kind = String(attrs.kind || "alert");
    const key = String(entity.key);
    const creator = entity.creator ? String(entity.creator) : "";
    const tx = attrs.tx ? String(attrs.tx) : "";
    const createdAt =
      entity.createdAt != null ? String(entity.createdAt) : undefined;
    const expiresAt =
      entity.expiresAt != null ? String(entity.expiresAt) : undefined;

    if (kind === "update") {
      const parent = String(attrs.parent || "");
      if (!parent) continue;
      const list = updatesByParent.get(parent) ?? [];
      list.push({
        key,
        note: readNote(entity) || String(attrs.title || "Update"),
        status: String(attrs.status || "update"),
        creator,
        tx,
        createdAt,
      });
      updatesByParent.set(parent, list);
      continue;
    }

    const title = String(attrs.title || "").trim();
    // Skip empty / placeholder titles so the feed stays clean
    if (!title || title.toLowerCase() === "untitled") continue;

    alerts.push({
      key,
      title,
      type: String(attrs.type || "status"),
      severity: Number(attrs.severity) || 1,
      status: String(attrs.status || "active"),
      region: String(attrs.region || "global"),
      description: readNote(entity),
      creator,
      tx,
      createdAt,
      expiresAt,
      updates: [],
    });
  }

  for (const alert of alerts) {
    const updates = updatesByParent.get(alert.key) ?? [];
    updates.sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
    alert.updates = updates;
  }

  // Severity first, then newest activity (last update or createdAt)
  alerts.sort((a, b) => {
    if (b.severity !== a.severity) return b.severity - a.severity;
    const aTime = Number(
      a.updates[a.updates.length - 1]?.createdAt || a.createdAt || 0,
    );
    const bTime = Number(
      b.updates[b.updates.length - 1]?.createdAt || b.createdAt || 0,
    );
    return bTime - aTime;
  });

  return alerts;
}

export async function loadAlertByKey(key: string): Promise<AlertRecord | null> {
  const feed = await loadPulseFeed(80);
  return feed.find((alert) => alert.key.toLowerCase() === key.toLowerCase()) ?? null;
}
