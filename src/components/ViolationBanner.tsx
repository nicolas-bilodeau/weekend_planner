"use client";

import { X } from "lucide-react";
import { formatLabel, violationKey } from "@/lib/weekends";
import type { ComputedWeekend } from "@/lib/types";
import styles from "./planner.module.css";

export function ViolationBanner({
  violations,
  onDismissAll,
}: {
  violations: [ComputedWeekend, ComputedWeekend][];
  onDismissAll: () => void;
}) {
  if (violations.length === 0) return null;

  return (
    <div className={styles.alertBanner}>
      <div className={styles.alertIcon}>!</div>
      <div className={styles.alertText}>
        <b>Règle brisée :</b> {violations.length} paire{violations.length > 1 ? "s" : ""}
        {" de week-ends consécutifs à l'extérieur."}{" "}
        {violations.map(([a, b], i) => (
          <span key={violationKey(a, b)} style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>
            {formatLabel(a)} + {formatLabel(b)}
            {i < violations.length - 1 ? " · " : ""}
          </span>
        ))}
      </div>
      <button className={styles.alertClose} onClick={onDismissAll} title="Masquer cette alerte">
        <X size={16} />
      </button>
    </div>
  );
}
