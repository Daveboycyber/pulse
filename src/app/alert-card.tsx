"use client";

import Link from "next/link";
import { useState } from "react";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { connectAccount, rememberTx, walletFor } from "@/lib/browser-wallet";
import {
  formatExpiresIn,
  type AlertRecord,
  type UpdateRecord,
} from "@/lib/pulse-feed";

export type { AlertRecord, UpdateRecord };

function short(value: string) {
  if (!value) return "";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function explorerTx(tx: string) {
  return `https://tiramisu.explorer.arkiv.network/tx/${tx}`;
}

function explorerAddress(address: string) {
  return `https://tiramisu.explorer.arkiv.network/address/${address}`;
}

function sevClass(severity: number) {
  if (severity >= 5) return "sev5";
  if (severity >= 4) return "sev4";
  if (severity >= 3) return "sev3";
  return "sev-low";
}

function updateChipClass(status: string) {
  if (status === "resolved") return "resolved";
  if (status === "worsened") return "worsened";
  return "";
}

export function AlertCard({ alert }: { alert: AlertRecord }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("resolved");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const latest = alert.updates[alert.updates.length - 1];
  const sev = sevClass(alert.severity);
  const expiresLabel = formatExpiresIn(alert.expiresAt);

  async function publishUpdate() {
    if (!note.trim()) {
      setMessage("Write what changed.");
      return;
    }
    setBusy(true);
    setMessage("Waiting for wallet signature…");
    try {
      const { provider, account } = await connectAccount();
      const walletClient = walletFor(provider, account);
      const { entityKey, txHash } = await walletClient.createEntity({
        payload: jsonToPayload({ note: note.trim(), source: "pulse-ui" }),
        contentType: "application/json",
        attributes: {
          app: "pulse",
          kind: "update",
          parent: alert.key,
          status,
          title: note.trim().slice(0, 80),
        },
        expires: ExpirationTime.fromHours(72),
      });
      await rememberTx(walletClient as never, entityKey, txHash);
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed.");
      setBusy(false);
    }
  }

  return (
    <article className={`pulse-alert ${sev}`}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>
            <Link
              href={`/alert/${encodeURIComponent(alert.key)}`}
              style={{ color: "var(--text)", textDecoration: "none" }}
            >
              {alert.title}
            </Link>
          </h2>
          {alert.description ? (
            <p
              className="pulse-muted pulse-small line-clamp-3"
              style={{ margin: "6px 0 0", lineHeight: 1.5 }}
            >
              {alert.description}
            </p>
          ) : null}
        </div>
        <span className={`pulse-chip ${sev}`}>Sev {alert.severity}</span>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginTop: 12,
        }}
      >
        <span className="pulse-chip">{alert.type}</span>
        <span className="pulse-chip">{alert.region}</span>
        <span className="pulse-chip">opened as {alert.status}</span>
        {latest && (
          <span className={`pulse-chip ${updateChipClass(latest.status)}`}>
            latest: {latest.status}
          </span>
        )}
        {alert.updates.length > 0 && (
          <span className="pulse-chip">
            {alert.updates.length} update
            {alert.updates.length === 1 ? "" : "s"}
          </span>
        )}
        {expiresLabel && (
          <span className="pulse-chip" title="Arkiv self-expiry (BTL)">
            {expiresLabel}
          </span>
        )}
      </div>

      <div
        className="pulse-muted pulse-small"
        style={{ marginTop: 14, lineHeight: 1.6 }}
      >
        <p style={{ margin: 0 }}>
          Creator{" "}
          {alert.creator ? (
            <a
              className="font-mono"
              href={explorerAddress(alert.creator)}
              target="_blank"
              rel="noreferrer"
            >
              {short(alert.creator)}
            </a>
          ) : (
            "unknown"
          )}
          <span style={{ opacity: 0.75 }}> · wallet-owned · site cannot delete</span>
        </p>
        <p
          className="font-mono"
          style={{
            margin: "2px 0 0",
            fontSize: 11,
            wordBreak: "break-all",
            opacity: 0.7,
          }}
        >
          {alert.key}
        </p>
        <p style={{ margin: "6px 0 0", display: "flex", flexWrap: "wrap", gap: 14 }}>
          <Link href={`/alert/${encodeURIComponent(alert.key)}`}>
            Open record
          </Link>
          {alert.tx && (
            <a href={explorerTx(alert.tx)} target="_blank" rel="noreferrer">
              View transaction
            </a>
          )}
        </p>
      </div>

      {alert.updates.length > 0 && (
        <ol
          style={{
            listStyle: "none",
            margin: "16px 0 0",
            padding: "0 0 0 12px",
            borderLeft: "1px solid var(--line)",
          }}
        >
          {alert.updates.map((update) => (
            <li key={update.key} style={{ padding: "0 0 12px 14px" }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                {update.note}
              </p>
              <p
                className="pulse-muted"
                style={{ margin: "4px 0 0", fontSize: 12 }}
              >
                <span className={`pulse-chip ${updateChipClass(update.status)}`}>
                  {update.status}
                </span>
                {update.creator ? ` · ${short(update.creator)}` : ""}
                {update.tx ? (
                  <>
                    {" · "}
                    <a
                      href={explorerTx(update.tx)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      tx
                    </a>
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ol>
      )}

      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="pulse-btn-ghost"
        >
          {open ? "Close" : "Add an update"}
        </button>
        {open && (
          <div
            style={{
              marginTop: 12,
              padding: 14,
              border: "1px solid var(--line)",
              borderRadius: 8,
              background: "var(--bg)",
              display: "grid",
              gap: 10,
            }}
          >
            <p className="pulse-muted pulse-small" style={{ margin: 0 }}>
              This does not change the alert above. Anyone can add a note. Only
              the note&apos;s owner can delete that note. The site has no admin
              key.
            </p>
            <textarea
              className="pulse-textarea"
              placeholder="What changed"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={400}
            />
            <select
              className="pulse-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="monitoring">monitoring</option>
              <option value="resolved">resolved</option>
              <option value="worsened">worsened</option>
            </select>
            <button
              type="button"
              onClick={publishUpdate}
              disabled={busy}
              className="pulse-btn"
            >
              {busy ? "Working…" : "Publish update"}
            </button>
            {message && (
              <p className="pulse-muted pulse-small" style={{ margin: 0 }}>
                {message}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
