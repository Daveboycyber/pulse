"use client";

import { useMemo, useState } from "react";
import { AlertCard, type AlertRecord } from "./alert-card";

export function FeedFilters({ alerts }: { alerts: AlertRecord[] }) {
  const [minSeverity, setMinSeverity] = useState(1);
  const [type, setType] = useState("all");
  const [region, setRegion] = useState("all");
  const [history, setHistory] = useState("all");

  const types = useMemo(
    () => Array.from(new Set(alerts.map((a) => a.type))).sort(),
    [alerts],
  );
  const regions = useMemo(
    () => Array.from(new Set(alerts.map((a) => a.region))).sort(),
    [alerts],
  );

  const filtered = alerts.filter((alert) => {
    if (alert.severity < minSeverity) return false;
    if (type !== "all" && alert.type !== type) return false;
    if (region !== "all" && alert.region !== region) return false;
    if (history === "with-updates" && alert.updates.length === 0) return false;
    if (history === "unresolved") {
      const latest = alert.updates[alert.updates.length - 1];
      if (latest?.status === "resolved") return false;
    }
    return true;
  });

  function resetFilters() {
    setMinSeverity(1);
    setType("all");
    setRegion("all");
    setHistory("all");
  }

  const filtersActive =
    minSeverity > 1 || type !== "all" || region !== "all" || history !== "all";

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <label>
          <span className="pulse-label">Min severity</span>
          <select
            className="pulse-select"
            value={minSeverity}
            onChange={(e) => setMinSeverity(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="pulse-label">Type</span>
          <select
            className="pulse-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">all</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="pulse-label">Region</span>
          <select
            className="pulse-select"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="all">all</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="pulse-label">History</span>
          <select
            className="pulse-select"
            value={history}
            onChange={(e) => setHistory(e.target.value)}
          >
            <option value="all">all</option>
            <option value="with-updates">has updates</option>
            <option value="unresolved">not resolved</option>
          </select>
        </label>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <p className="pulse-muted pulse-small" style={{ margin: 0 }}>
          Showing {filtered.length} of {alerts.length} alerts
        </p>
        {filtersActive && (
          <button type="button" onClick={resetFilters} className="pulse-btn-ghost">
            Reset filters
          </button>
        )}
      </div>

      <div>
        {alerts.length === 0 && (
          <div className="pulse-card" style={{ textAlign: "center", padding: 32 }}>
            <p style={{ margin: 0, fontWeight: 500 }}>No public alerts yet</p>
            <p className="pulse-muted pulse-small" style={{ margin: "8px 0 0" }}>
              Be the first to post one from your wallet. Records are wallet-owned
              and self-expiring on Arkiv Tiramisu.
            </p>
          </div>
        )}
        {alerts.length > 0 && filtered.length === 0 && (
          <div className="pulse-card" style={{ textAlign: "center", padding: 32 }}>
            <p style={{ margin: 0, fontWeight: 500 }}>
              No alerts match these filters
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="pulse-btn-ghost"
              style={{ marginTop: 12 }}
            >
              Reset filters
            </button>
          </div>
        )}
        {filtered.map((alert) => (
          <AlertCard key={alert.key} alert={alert} />
        ))}
      </div>
    </div>
  );
}
