"use client";

import { ShieldCheck } from "lucide-react";
import { MONTHS_ABBR, formatLabel } from "@/lib/weekends";
import type { ComputedWeekend } from "@/lib/types";
import styles from "./planner.module.css";

const STATUS_CLASS: Record<ComputedWeekend["status"], string> = {
  libre: styles.wkCellLibre,
  protege: styles.wkCellProtege,
  partiel: styles.wkCellPartiel,
  occupe: styles.wkCellOccupe,
};

const CATEGORY_COLOR: Record<string, string> = {
  obligation: "var(--color-cat-obligation)",
  prevu: "var(--color-cat-prevu)",
  envie: "var(--color-cat-envie)",
};

interface MonthGroup {
  year: number;
  month: number;
  weekends: ComputedWeekend[];
}

export function AnnualGrid({
  years,
  yearFilter,
  onYearFilterChange,
  hidePast,
  onHidePastChange,
  byMonth,
  selectedId,
  onSelectWeekend,
}: {
  years: number[];
  yearFilter: "both" | number;
  onYearFilterChange: (v: "both" | number) => void;
  hidePast: boolean;
  onHidePastChange: (v: boolean) => void;
  byMonth: MonthGroup[];
  selectedId: string | null;
  onSelectWeekend: (id: string) => void;
}) {
  return (
    <>
      <div className={styles.controlsRow}>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: "var(--color-status-libre)", border: "1px solid var(--color-status-libre-border)" }}
            />
            Libre
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "var(--color-status-protege)" }} />
            Protégé
          </div>
          <div className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: "var(--color-status-partiel)", border: "1px solid var(--color-status-partiel-border)" }}
            />
            Local seulement
          </div>
          <div className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: "var(--color-status-occupe)", border: "1px solid var(--color-status-occupe-border)" }}
            />
            À l&apos;extérieur
          </div>
        </div>
        <div className={styles.viewControls}>
          <div className={styles.segmented}>
            <button
              className={`${styles.segBtn} ${yearFilter === "both" ? styles.segBtnActive : ""}`}
              onClick={() => onYearFilterChange("both")}
            >
              Les deux
            </button>
            {years.map((y) => (
              <button
                key={y}
                className={`${styles.segBtn} ${yearFilter === y ? styles.segBtnActive : ""}`}
                onClick={() => onYearFilterChange(y)}
              >
                {y}
              </button>
            ))}
          </div>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={hidePast}
              onChange={(e) => onHidePastChange(e.target.checked)}
            />
            Cacher les mois passés
          </label>
        </div>
      </div>

      <div className={styles.grid}>
        {byMonth.length === 0 && (
          <div className={styles.emptyState}>
            Rien à afficher avec ces filtres — essaie d&apos;afficher les deux années ou de
            désactiver &quot;Cacher les mois passés&quot;.
          </div>
        )}
        {byMonth.map((group) => (
          <div className={styles.monthRow} key={group.year + "-" + group.month}>
            <div className={styles.monthLabel}>
              {MONTHS_ABBR[group.month]} &apos;{String(group.year).slice(2)}
            </div>
            <div className={styles.monthCells}>
              {group.weekends.map((w) => (
                <div
                  key={w.id}
                  className={`${styles.wkCell} ${STATUS_CLASS[w.status]} ${
                    selectedId === w.id ? styles.wkCellSelected : ""
                  }`}
                  onClick={() => onSelectWeekend(w.id)}
                >
                  <div className={styles.wkDate}>{formatLabel(w)}</div>
                  <div className={styles.wkDots}>
                    {w.status === "protege" && <ShieldCheck size={12} className={styles.wkShield} />}
                    {w.events.map((ev) => (
                      <span
                        key={ev.id}
                        className={styles.wkDot}
                        style={{ background: CATEGORY_COLOR[ev.category] }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
