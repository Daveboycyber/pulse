import { publicClient } from "@/lib/arkiv";
import { eq } from "@arkiv-network/sdk/query";
import { PostAlert } from "./post-alert";
import { AlertCard, type AlertRecord, type UpdateRecord } from "./alert-card";

export const instant = false;

function getAttrValue(attr: any): any {
  if (attr == null) return null;
  if (typeof attr === "object" && "value" in attr) return attr.value;
  return attr;
}

function readAttrs(entity: any) {
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

function readNote(entity: any) {
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

export default async function Home() {
  const result = await publicClient
    .select({
      key: true,
      attributes: true,
      payload: true,
      creator: true,
      createdAt: true,
    })
    .where(eq("app", "pulse"))
    .limit(40)
    .fetch();

  const updatesByParent = new Map<string, UpdateRecord[]>();
  const alerts: AlertRecord[] = [];

  for (const entity of result.entities as any[]) {
    const attrs = readAttrs(entity);
    const kind = String(attrs.kind || "alert");
    const key = String(entity.key);
    const creator = entity.creator ? String(entity.creator) : "";
    const tx = attrs.tx ? String(attrs.tx) : "";

    if (kind === "update") {
      const parent = String(attrs.parent || "");
      const list = updatesByParent.get(parent) ?? [];
      list.push({
        key,
        note: readNote(entity) || String(attrs.title || "Update"),
        status: String(attrs.status || "update"),
        creator,
        tx,
      });
      updatesByParent.set(parent, list);
      continue;
    }

    const title = String(attrs.title || "");
    if (!title) continue;
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
      updates: [],
    });
  }

  for (const alert of alerts) {
    alert.updates = updatesByParent.get(alert.key) ?? [];
  }
  alerts.sort((a, b) => b.severity - a.severity);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Pulse</h1>
        <p className="text-zinc-400 mb-3">
          A public incident record. The site has no admin key. It cannot edit or delete an alert it did not create.
        </p>
        <p className="text-sm text-zinc-500 mb-8">
          An alert is one Arkiv entity. A correction is a second entity that points at the first. The original text stays. Both expire on their own.
        </p>

        <PostAlert />

        <div className="space-y-4">
          {alerts.length === 0 && <p className="text-zinc-500">No alerts found.</p>}
          {alerts.map((alert) => (
            <AlertCard key={alert.key} alert={alert} />
          ))}
        </div>

        <p className="text-xs text-zinc-600 mt-10">
          Arkiv Tiramisu · chain 7738577 · query app = pulse · wallet-owned · self-expiring
        </p>
      </div>
    </main>
  );
}
