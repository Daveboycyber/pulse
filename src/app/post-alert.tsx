"use client";

import { useState } from "react";
import { i32 } from "@arkiv-network/sdk/attr";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { connectAccount, walletFor, rememberTx } from "@/lib/browser-wallet";

export function PostAlert() {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("incident");
  const [severity, setSeverity] = useState(3);
  const [region, setRegion] = useState("global");
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function connect() {
    setBusy(true);
    setMessage("");
    try {
      const { account: next } = await connectAccount();
      setAccount(next);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Wallet connection failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!account) return;
    if (!title.trim() || !description.trim()) {
      setMessage("Title and description are required.");
      return;
    }
    setBusy(true);
    setMessage("Waiting for wallet signature…");
    try {
      const { provider } = await connectAccount();
      const walletClient = walletFor(provider, account);
      const { entityKey, txHash } = await walletClient.createEntity({
        payload: jsonToPayload({
          description: description.trim(),
          source: "pulse-ui",
        }),
        contentType: "application/json",
        attributes: {
          app: "pulse",
          kind: "alert",
          type,
          severity: i32(severity),
          status: "active",
          region: region.trim() || "global",
          title: title.trim(),
        },
        expires: ExpirationTime.fromHours(hours),
      });
      setMessage("Saving the transaction link…");
      await rememberTx(walletClient as never, entityKey, txHash);
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Post failed.");
      setBusy(false);
    }
  }

  const canPublish = Boolean(account && title.trim() && description.trim());

  return (
    <section className="pulse-card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 8,
        }}
      >
        <h2 style={{ margin: 0 }}>Open an alert</h2>
        {account ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              className="font-mono pulse-muted pulse-small"
              style={{ fontSize: 12 }}
            >
              {account.slice(0, 6)}…{account.slice(-4)}
            </span>
            <a
              href="https://hub.arkiv.network/faucet"
              target="_blank"
              rel="noreferrer"
              className="pulse-small"
              style={{ color: "var(--muted)" }}
            >
              Need GLM?
            </a>
          </div>
        ) : (
          <button
            type="button"
            onClick={connect}
            disabled={busy}
            className="pulse-btn"
          >
            Connect wallet
          </button>
        )}
      </div>

      <p className="pulse-muted pulse-small" style={{ marginBottom: 16 }}>
        Creates the first record — it is not edited later. Later notes are
        separate entities. The wallet needs test GLM from{" "}
        <a
          href="https://hub.arkiv.network/faucet"
          target="_blank"
          rel="noreferrer"
        >
          the faucet
        </a>
        .
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <input
          className="pulse-input"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
        <textarea
          className="pulse-textarea"
          placeholder="What happened"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 12,
          }}
        >
          <label>
            <span className="pulse-label">Type</span>
            <select
              className="pulse-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="incident">incident</option>
              <option value="outage">outage</option>
              <option value="status">status</option>
              <option value="safety">safety</option>
            </select>
          </label>
          <label>
            <span className="pulse-label">Severity</span>
            <select
              className="pulse-select"
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="pulse-label">Region</span>
            <input
              className="pulse-input"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              maxLength={32}
            />
          </label>
          <label>
            <span className="pulse-label">Expires in</span>
            <select
              className="pulse-select"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            >
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
              <option value={72}>72 hours</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={account ? publish : connect}
          disabled={busy || (account ? !canPublish : false)}
          className="pulse-btn"
          style={{ padding: "10px 14px" }}
        >
          {busy
            ? "Working…"
            : account
              ? "Publish alert"
              : "Connect wallet to publish"}
        </button>
        {message && (
          <p className="pulse-muted pulse-small" style={{ margin: 0 }}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
