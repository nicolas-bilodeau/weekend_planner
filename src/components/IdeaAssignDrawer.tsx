"use client";

import { X } from "lucide-react";
import { formatLabel } from "@/lib/weekends";
import type { ComputedWeekend } from "@/lib/types";
import styles from "./planner.module.css";

const STATUS_LABEL: Record<ComputedWeekend["status"], string> = {
  libre: "Libre",
  protege: "Protégé",
  partiel: "Local seulement",
  occupe: "À l'extérieur",
};

export function IdeaAssignDrawer({
  candidates,
  onPick,
  onClose,
}: {
  candidates: ComputedWeekend[];
  onPick: (weekendId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHead}>
          <div className={styles.drawerDate}>Choisir un week-end</div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.sectionLabel}>Week-ends libres ou partiels</div>
        <div className={styles.pickList}>
          {candidates.map((w) => (
            <div className={styles.pickItem} key={w.id} onClick={() => onPick(w.id)}>
              <span style={{ fontFamily: "var(--font-mono)" }}>
                {formatLabel(w)} &apos;{String(w.year).slice(2)}
              </span>
              <span className={styles.statusPill} style={{ margin: 0 }}>
                {STATUS_LABEL[w.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
