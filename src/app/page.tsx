import { publicClient } from "@/lib/arkiv";
import { eq } from "@arkiv-network/sdk/query";

export const instant = false;

function getAttrValue(attr: any): any {
  if (attr == null) return null;
  if (typeof attr === "object" && "value" in attr) return attr.value;
  return attr;
}

export default async function Home() {
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
    .limit(20)
    .fetch();

  const alerts = result.entities
    .map((entity: any) => {
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

      let description = "";
      try {
        if (typeof entity.toJson === "function") {
          const payload = entity.toJson();
          description = payload?.description || "";
        }
      } catch {
        description = "";
      }

      return {
        key: String(entity.key),
        title: String(attrs.title || "Untitled"),
        type: String(attrs.type || "status"),
        severity: Number(attrs.severity) || 1,
        status: String(attrs.status || "active"),
        region: String(attrs.region || "global"),
        description: String(description),
        creator: entity.creator ? String(entity.creator) : "",
      };
    })
    .filter((alert) => alert.title !== "Untitled")
    .sort((a, b) => b.severity - a.severity);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Pulse</h1>
        <p className="text-zinc-400 mb-8">
          Censorship-resistant public incident & status feed · powered by Arkiv
        </p>

        <div className="space-y-4">
          {alerts.length === 0 && (
            <p className="text-zinc-500">No active alerts found.</p>
          )}

          {alerts.map((alert) => (
            <div
              key={alert.key}
              className="border border-zinc-800 rounded-lg p-5 bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{alert.title}</h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    {alert.description}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded shrink-0 ${
                    alert.severity >= 4
                      ? "bg-red-900/50 text-red-300"
                      : alert.severity >= 3
                      ? "bg-orange-900/50 text-orange-300"
                      : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  Sev {alert.severity}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 mt-4 text-xs text-zinc-500">
                <span className="bg-zinc-800 px-2 py-1 rounded">{alert.type}</span>
                <span className="bg-zinc-800 px-2 py-1 rounded">{alert.region}</span>
                <span className="bg-zinc-800 px-2 py-1 rounded">{alert.status}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-600 mt-10">
          Data lives on Arkiv Tiramisu · Wallet-owned · Self-expiring · No single operator can take this feed down
        </p>
      </div>
    </main>
  );
}
