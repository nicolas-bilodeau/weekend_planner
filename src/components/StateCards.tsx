"use client";

import styles from "./planner.module.css";

/** "Le week-end est à vous" — shown when a list has nothing in it. */
export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className={styles.stateCard}>
      <div className={styles.stateShapes}>
        <span
          className={styles.stateShape}
          style={{ background: "var(--color-brand-yellow)", borderRadius: 8, transform: "rotate(-8deg)" }}
        />
        <span
          className={styles.stateShape}
          style={{ background: "var(--color-brand-teal)", borderRadius: "50%" }}
        />
        <span
          className={styles.stateShape}
          style={{ background: "var(--color-brand-pink)", clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}
        />
      </div>
      <div className={styles.stateTitle}>{title}</div>
      <div className={styles.stateSubtitle}>{subtitle}</div>
    </div>
  );
}

/** "On déplie l'année…" — shown while the initial fetch is in flight. */
export function LoadingState({ title = "On déplie l'année…", subtitle = "Deux secondes, on épingle les confettis." }) {
  return (
    <div className={styles.stateCard}>
      <div className={styles.stateSpinner} />
      <div className={styles.stateTitle}>{title}</div>
      <div className={styles.stateSubtitle}>{subtitle}</div>
    </div>
  );
}

/** "L'année boude" — shown when the initial fetch fails, with a retry action. */
export function ErrorState({
  title = "L'année boude",
  subtitle = "Impossible de charger. On réessaie ?",
  onRetry,
}: {
  title?: string;
  subtitle?: string;
  onRetry: () => void;
}) {
  return (
    <div className={`${styles.stateCard} ${styles.stateCardError}`}>
      <div className={styles.stateIconBadge}>?!</div>
      <div className={`${styles.stateTitle} ${styles.stateTitleError}`}>{title}</div>
      <div className={`${styles.stateSubtitle} ${styles.stateSubtitleError}`}>{subtitle}</div>
      <button className={styles.retryBtn} onClick={onRetry}>
        Réessayer
      </button>
    </div>
  );
}
