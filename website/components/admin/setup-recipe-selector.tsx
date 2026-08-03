"use client";

import { useEffect, useState } from "react";

import styles from "../../app/admin/protected-admin-shell.module.css";
import { SetupRecipeEditor } from "./setup-recipe-editor";

type ParentStatus = "draft" | "published" | "archived";

export type SetupRecipeEditorCandidate = {
  id: string;
  name: string;
  parentStatus: ParentStatus;
  categoryName: string;
  imageReady: boolean;
  availableProducts: Array<{ id: string; name: string }>;
};

export function SetupRecipeSelector({
  workspaceId,
  candidates
}: {
  workspaceId: string;
  candidates: SetupRecipeEditorCandidate[];
}) {
  const [selectedProductId, setSelectedProductId] = useState(
    candidates[0]?.id ?? ""
  );
  const selected =
    candidates.find((candidate) => candidate.id === selectedProductId) ??
    candidates[0];

  useEffect(() => {
    if (selected && selected.id !== selectedProductId) {
      setSelectedProductId(selected.id);
    }
  }, [selected, selectedProductId]);

  if (!selected) return null;

  return (
    <div className={styles.setupCardGrid}>
      <section className={styles.setupCard} aria-label="Setup recipe parent selection">
        <div className={styles.setupCardHeader}>
          <div>
            <h3>Choose a setup parent</h3>
            <p>Only the selected setup parent loads its recipe.</p>
          </div>
        </div>
        <label htmlFor="setup-recipe-parent-select">Setup recipe parent</label>
        <select
          id="setup-recipe-parent-select"
          value={selected.id}
          onChange={(event) => setSelectedProductId(event.target.value)}
          aria-describedby="setup-recipe-parent-help"
        >
          {candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name} ({candidate.parentStatus})
            </option>
          ))}
        </select>
        <p id="setup-recipe-parent-help">
          Switching parents replaces the editor with an authoritative load for the
          newly selected product.
        </p>
        <div className={styles.setupCardMeta}>
          <span>{selected.categoryName}</span>
          <span
            className={`${styles.statusTag} ${
              selected.imageReady
                ? styles.statusTagPublished
                : styles.statusTagWarning
            }`}
          >
            {selected.imageReady ? "Image ready" : "Image review"}
          </span>
        </div>
      </section>

      <article
        className={styles.setupCard}
        aria-label={`Recipe editor for ${selected.name}`}
        key={selected.id}
      >
        <div className={styles.setupCardHeader}>
          <div>
            <h3>{selected.name}</h3>
            <p>{selected.categoryName}</p>
          </div>
        </div>
        <SetupRecipeEditor
          workspaceId={workspaceId}
          setupProductId={selected.id}
          setupProductName={selected.name}
          parentStatus={selected.parentStatus}
          availableProducts={selected.availableProducts}
        />
      </article>
    </div>
  );
}
