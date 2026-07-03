"use client";

import { MONTHS_ABBR, formatLabel } from "@/lib/weekends";
import type { ComputedWeekend, WeekendStatus } from "@/lib/types";
import { StatusIcon } from "./StatusIcon";
import { CategoryDot } from "./CategoryDot";
import styles from "./planner.module.css";

const STATUS_CLASS: Record<WeekendStatus, string> = {
  libre: styles.wkCellLibre,
  protege: styles.wkCellProtege,
  partiel: styles.wkCellPartiel,
  occupe: styles.wkCellOccupe,
};

const STATUS_SWATCH_CLASS: Record<WeekendStatus, string> = {
  libre: styles.legendSwatchLibre,
  protege: styles.legendSwatchProtege,
  partiel: styles.legendSwatchPartiel,
  occupe: styles.legendSwatchOccupe,
};

const STATUS_LABEL: Record<WeekendStatus, string> = {
  libre: "Libre",
  protege: "Protégé",
  partiel: "Local seulement",
  occupe: "À l'extérieur",
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
          {(["libre", "protege", "partiel", "occupe"] as WeekendStatus[]).map((status) => (
            <div className={styles.legendItem} key={status}>
              <span className={`${styles.legendSwatch} ${STATUS_SWATCH_CLASS[status]}`} />
              <StatusIcon status={status} size={9} />
              <span className={styles.legendLabel}>{STATUS_LABEL[status]}</span>
            </div>
          ))}
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
                    <StatusIcon status={w.status} size={11} />
                    {w.events.map((ev) => (
                      <CategoryDot key={ev.id} category={ev.category} size={7} />
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
