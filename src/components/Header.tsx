"use client";

import { Calendar, Sparkles, Repeat } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import styles from "./planner.module.css";

export type Tab = "grid" | "ideas" | "rules";

export function Header({
  tab,
  onTabChange,
  occupied,
  total,
  percent,
  yearLabel,
  backlogCount,
}: {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  occupied: number;
  total: number;
  percent: number;
  yearLabel: string;
  backlogCount: number;
}) {
  const { user, signOut } = useAuth();

  return (
    <div className={styles.header}>
      <div className={styles.eyebrow}>Planificateur annuel</div>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Nos week-ends</h1>
        <div className={styles.headerActions}>
          <div className={styles.ratioPill}>
            <span className={styles.ratioBar}>
              <span className={styles.ratioBarFill} style={{ width: percent + "%" }} />
            </span>
            {occupied}/{total} occupés · {percent}%
            <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
              · {yearLabel}
            </span>
          </div>
          {user && (
            <button className={styles.signOutBtn} onClick={signOut}>
              Déconnexion
            </button>
          )}
        </div>
      </div>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "grid" ? styles.tabActive : ""}`}
          onClick={() => onTabChange("grid")}
        >
          <Calendar size={14} /> Vue annuelle
        </button>
        <button
          className={`${styles.tab} ${tab === "ideas" ? styles.tabActive : ""}`}
          onClick={() => onTabChange("ideas")}
        >
          <Sparkles size={14} /> Idées ({backlogCount})
        </button>
        <button
          className={`${styles.tab} ${tab === "rules" ? styles.tabActive : ""}`}
          onClick={() => onTabChange("rules")}
        >
          <Repeat size={14} /> Récurrents
        </button>
      </div>
    </div>
  );
}
