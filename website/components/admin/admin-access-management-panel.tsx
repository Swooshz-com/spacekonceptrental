"use client";

import { useState, type FormEvent } from "react";

import styles from "./admin-access-management-panel.module.css";

export type AdminAccessPanelRecord = {
  email: string;
  role: "owner" | "admin";
  status: "active" | "disabled" | "removed";
  createdAt: string;
  updatedAt: string;
};

export type AdminAccessPanelProps = {
  currentAdmin: {
    email: string;
    role: "owner" | "admin";
    canManageAccess: boolean;
  };
  records: AdminAccessPanelRecord[];
  fetcher?: typeof fetch;
  onMutationComplete?: () => void | Promise<void>;
};

type PanelStatus =
  | {
      kind: "idle";
    }
  | {
      kind: "pending";
      message: string;
    }
  | {
      kind: "success";
      message: string;
    }
  | {
      kind: "error";
      message: string;
    };

const accessWriteOperation = "membership.manage";
const defaultFailure =
  "Admin access could not be updated. Check the email and try again.";

function normalizeEmail(value: string) {
  const normalized = value.trim().toLowerCase();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

function reloadDashboard() {
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}

async function readSafeJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function requestWriteProof(fetcher: typeof fetch) {
  const response = await fetcher("/api/admin/csrf-proof", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requestedOperation: accessWriteOperation,
      operation: accessWriteOperation
    })
  });

  if (!response.ok) {
    return null;
  }

  const body = await readSafeJson(response);

  if (
    !isRecord(body) ||
    body.ok !== true ||
    typeof body.csrfProof !== "string" ||
    !body.csrfProof.trim()
  ) {
    return null;
  }

  return body.csrfProof;
}

function statusLabel(status: AdminAccessPanelRecord["status"]) {
  if (status === "active") {
    return "Active";
  }

  if (status === "disabled") {
    return "Disabled";
  }

  return "Removed";
}

function statusClass(status: AdminAccessPanelRecord["status"]) {
  if (status === "active") {
    return styles.statusActive;
  }

  if (status === "disabled") {
    return styles.statusDisabled;
  }

  return styles.statusRemoved;
}

function roleLabel(role: AdminAccessPanelRecord["role"]) {
  return role === "owner" ? "Owner" : "Admin";
}

export function AdminAccessManagementPanel({
  currentAdmin,
  records,
  fetcher = fetch,
  onMutationComplete = reloadDashboard
}: AdminAccessPanelProps) {
  const [status, setStatus] = useState<PanelStatus>({ kind: "idle" });
  const [email, setEmail] = useState("");

  const activeAdmins = records.filter(
    (record) => record.status === "active" && record.role === "admin"
  );
  const inactiveAdmins = records.filter(
    (record) => record.status !== "active" && record.role === "admin"
  );
  const owner = records.find((record) => record.role === "owner");

  async function submitAction(action: "add_admin" | "disable_admin" | "remove_admin", targetEmail: string) {
    const normalizedEmail = normalizeEmail(targetEmail);

    if (!normalizedEmail) {
      setStatus({
        kind: "error",
        message: "Enter a valid admin email address."
      });
      return;
    }

    setStatus({
      kind: "pending",
      message: "Updating admin access..."
    });

    const csrfProof = await requestWriteProof(fetcher);

    if (!csrfProof) {
      setStatus({
        kind: "error",
        message: defaultFailure
      });
      return;
    }

    const response = await fetcher("/api/admin/admin-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-proof": csrfProof
      },
      body: JSON.stringify({
        action,
        email: normalizedEmail
      })
    });
    const body = await readSafeJson(response);

    if (!response.ok || !isRecord(body) || body.ok !== true) {
      const error =
        isRecord(body) && typeof body.error === "string" ? body.error : null;
      setStatus({
        kind: "error",
        message:
          error === "owner_immutable"
            ? "The owner cannot be removed or disabled."
            : error === "owner_required"
              ? "Only the owner can manage admin access."
              : defaultFailure
      });
      return;
    }

    setStatus({
      kind: "success",
      message: "Admin access updated."
    });
    setEmail("");
    await onMutationComplete();
  }

  async function handleAddAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentAdmin.canManageAccess) {
      setStatus({
        kind: "error",
        message: "Only the owner can manage admin access."
      });
      return;
    }

    await submitAction("add_admin", email);
  }

  return (
    <section className={styles.panel} aria-label="Admin access management">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Google Admin Access</p>
          <h2>Admin access</h2>
          <p>
            Admins must sign in with Google using the exact email listed here.
            Google sign-in alone does not grant access.
          </p>
        </div>
        <span className={styles.currentAdmin}>
          Signed in as {currentAdmin.email}
        </span>
      </div>

      {status.kind !== "idle" ? (
        <p
          className={`${styles.notice} ${
            status.kind === "error" ? styles.noticeError : ""
          }`}
          role="status"
        >
          {status.message}
        </p>
      ) : null}

      <div className={styles.summaryGrid}>
        <div>
          <span>{owner?.email ?? "Owner not linked"}</span>
          <strong>Owner</strong>
          <p>Owner access cannot be removed or disabled.</p>
        </div>
        <div>
          <span>{activeAdmins.length}</span>
          <strong>Active admins</strong>
          <p>Can manage protected content after Google sign-in.</p>
        </div>
        <div>
          <span>{inactiveAdmins.length}</span>
          <strong>Disabled or removed</strong>
          <p>Blocked from protected admin content.</p>
        </div>
      </div>

      {currentAdmin.canManageAccess ? (
        <form className={styles.addForm} onSubmit={handleAddAdmin}>
          <label>
            Add admin by Google email
            <input
              autoComplete="email"
              name="adminEmail"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              required
              type="email"
              value={email}
            />
          </label>
          <button disabled={status.kind === "pending"} type="submit">
            Add admin
          </button>
          <p>
            No invitation email is sent here. After the email is added, that
            admin can sign in with Google.
          </p>
        </form>
      ) : (
        <p className={styles.readOnlyNotice}>
          Admin access changes are owner-only.
        </p>
      )}

      <div className={styles.list} role="table" aria-label="Admin access list">
        <div className={styles.listHeader} role="row">
          <strong role="columnheader">Email</strong>
          <strong role="columnheader">Role</strong>
          <strong role="columnheader">Status</strong>
          <strong role="columnheader">Actions</strong>
        </div>
        {records.map((record) => (
          <div className={styles.listRow} role="row" key={record.email}>
            <span role="cell">{record.email}</span>
            <span role="cell">{roleLabel(record.role)}</span>
            <span role="cell">
              <span className={`${styles.statusPill} ${statusClass(record.status)}`}>
                {statusLabel(record.status)}
              </span>
            </span>
            <span className={styles.actions} role="cell">
              {record.role === "owner" ? (
                <span className={styles.ownerLocked}>Protected owner</span>
              ) : currentAdmin.canManageAccess && record.status === "active" ? (
                <>
                  <button
                    disabled={status.kind === "pending"}
                    onClick={() => void submitAction("disable_admin", record.email)}
                    type="button"
                  >
                    Disable
                  </button>
                  <button
                    disabled={status.kind === "pending"}
                    onClick={() => void submitAction("remove_admin", record.email)}
                    type="button"
                  >
                    Remove
                  </button>
                </>
              ) : currentAdmin.canManageAccess ? (
                <button
                  disabled={status.kind === "pending"}
                  onClick={() => void submitAction("add_admin", record.email)}
                  type="button"
                >
                  Reactivate
                </button>
              ) : (
                <span>Owner managed</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
