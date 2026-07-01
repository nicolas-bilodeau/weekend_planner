"use client";

import { useState } from "react";
import { Settings2, Trash2 } from "lucide-react";
import { MONTHS_FULL, formatLabel, nearestWeekend } from "@/lib/weekends";
import type { LocationKind, RecurringRuleRow, SkippedRecurringInstanceRow, Weekend } from "@/lib/types";
import type { NewRuleInput } from "@/hooks/usePlannerData";
import styles from "./planner.module.css";

export function RecurringRules({
  rules,
  years,
  weekendsByYear,
  skippedInstances,
  onSubmitNewRule,
  onDeleteRule,
}: {
  rules: RecurringRuleRow[];
  years: number[];
  weekendsByYear: Record<number, Weekend[]>;
  skippedInstances: SkippedRecurringInstanceRow[];
  onSubmitNewRule: (input: NewRuleInput) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
}) {
  const [newRule, setNewRule] = useState<{
    title: string;
    month: number;
    day: number;
    location: LocationKind;
  }>({ title: "", month: 12, day: 24, location: "exterieur" });

  const skippedKeys = new Set(skippedInstances.map((s) => `${s.recurring_rule_id}-${s.year}`));

  async function submit() {
    if (!newRule.title.trim()) return;
    await onSubmitNewRule({ ...newRule, title: newRule.title.trim() });
    setNewRule({ title: "", month: 12, day: 24, location: "exterieur" });
  }

  return (
    <div className={styles.rulesWrap}>
      <div className={styles.rulesHead}>
        <Settings2 size={16} />
        <div className={styles.sectionLabel} style={{ margin: 0 }}>
          Événements récurrents chaque année
        </div>
      </div>
      <div className={styles.rulesSub}>
        Configure ici les incontournables qui reviennent chaque année (Noël, anniversaires...).
        L&apos;app trouve automatiquement le week-end le plus proche de la date visée, pour{" "}
        {years.join(" et ")}.
      </div>

      {rules.map((rule) => (
        <div className={styles.ruleCard} key={rule.id}>
          <div className={styles.ruleInfo}>
            <div className={styles.ruleTitle}>{rule.title}</div>
            <div className={styles.ruleMeta}>
              Cible : {rule.day} {MONTHS_FULL[rule.month - 1]} ·{" "}
              {rule.location === "ville" ? "Dans notre ville" : "À l'extérieur"}
            </div>
            <div className={styles.ruleTargets}>
              {years.map((year) => {
                const key = `${rule.id}-${year}`;
                const w = nearestWeekend(year, rule.month, rule.day, weekendsByYear[year] ?? []);
                const skipped = skippedKeys.has(key);
                return (
                  <span key={year} className={styles.ruleTarget}>
                    {year} → {skipped ? "retiré cette année-là" : w ? formatLabel(w) : "—"}
                  </span>
                );
              })}
            </div>
          </div>
          <button
            className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
            onClick={() => onDeleteRule(rule.id)}
          >
            <Trash2 size={13} /> Supprimer
          </button>
        </div>
      ))}

      <div className={styles.ruleForm}>
        <div className={styles.sectionLabel} style={{ margin: 0 }}>
          Ajouter un événement récurrent
        </div>
        <input
          className={styles.inputEl}
          placeholder="Ex. Fête des Mères"
          value={newRule.title}
          onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
        />
        <div className={styles.row3}>
          <select
            className={styles.selectEl}
            value={newRule.month}
            onChange={(e) => setNewRule({ ...newRule, month: Number(e.target.value) })}
          >
            {MONTHS_FULL.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <input
            className={styles.inputEl}
            type="number"
            min="1"
            max="31"
            value={newRule.day}
            onChange={(e) => setNewRule({ ...newRule, day: Number(e.target.value) })}
          />
          <select
            className={styles.selectEl}
            value={newRule.location}
            onChange={(e) => setNewRule({ ...newRule, location: e.target.value as LocationKind })}
          >
            <option value="ville">Dans notre ville</option>
            <option value="exterieur">À l&apos;extérieur</option>
          </select>
        </div>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={submit}>
          Ajouter la récurrence
        </button>
      </div>
    </div>
  );
}
