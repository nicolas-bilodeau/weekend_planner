"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Home,
  MapPin,
  Plus,
  Repeat,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { formatLabel, isoDate } from "@/lib/weekends";
import { CATEGORY_LABEL } from "@/lib/types";
import type { ComputedWeekend, EventCategory, IdeaRow, LocationKind, PlannerEvent } from "@/lib/types";
import type { NewEventInput } from "@/hooks/usePlannerData";
import styles from "./planner.module.css";

const CATEGORY_COLOR: Record<EventCategory, string> = {
  obligation: "var(--color-cat-obligation)",
  prevu: "var(--color-cat-prevu)",
  envie: "var(--color-cat-envie)",
};

const STATUS_LABEL: Record<ComputedWeekend["status"], React.ReactNode> = {
  libre: "Libre",
  protege: (
    <>
      <ShieldCheck size={13} /> Protégé
    </>
  ),
  partiel: "Local seulement",
  occupe: "À l'extérieur",
};

export function WeekendDrawer({
  selected,
  isPartOfViolation,
  backlogIdeas,
  onClose,
  onAddEvent,
  onRemoveEvent,
  onToggleProtected,
  onPickIdea,
}: {
  selected: ComputedWeekend;
  isPartOfViolation: boolean;
  backlogIdeas: IdeaRow[];
  onClose: () => void;
  onAddEvent: (input: NewEventInput) => Promise<void>;
  onRemoveEvent: (event: PlannerEvent) => Promise<void>;
  onToggleProtected: () => void;
  onPickIdea: (ideaId: string) => Promise<void>;
}) {
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showIdeaPicker, setShowIdeaPicker] = useState(false);
  const [newEvent, setNewEvent] = useState<{ title: string; category: EventCategory; location: LocationKind }>({
    title: "",
    category: "prevu",
    location: "ville",
  });

  async function submitNewEvent() {
    if (!newEvent.title.trim()) return;
    await onAddEvent({
      title: newEvent.title.trim(),
      category: newEvent.category,
      location: newEvent.location,
      startDate: selected.id,
      endDate: isoDate(selected.sun),
    });
    setNewEvent({ title: "", category: "prevu", location: "ville" });
    setShowAddEvent(false);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHead}>
          <div className={styles.drawerDate}>
            {formatLabel(selected)} &apos;{String(selected.year).slice(2)}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.statusPill}>{STATUS_LABEL[selected.status]}</div>

        {isPartOfViolation && (
          <div className={styles.warnNote}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            Ce week-end fait partie d&apos;une paire consécutive à l&apos;extérieur.
          </div>
        )}

        <div className={styles.sectionLabel}>Ce qui est prévu</div>
        {selected.events.length === 0 && (
          <div style={{ fontSize: 13.5, color: "var(--color-text-muted)" }}>
            Rien de prévu pour l&apos;instant.
          </div>
        )}
        {selected.events.map((ev) => (
          <div className={styles.eventRow} key={ev.id}>
            <span className={styles.catDot} style={{ background: CATEGORY_COLOR[ev.category] }} />
            <span className={styles.eventTitle}>
              {ev.title}
              {ev.recurringRuleId && (
                <Repeat size={11} style={{ marginLeft: 6, verticalAlign: "middle", color: "var(--color-text-muted)" }} />
              )}
            </span>
            <span className={styles.eventMeta}>
              {ev.location === "ville" ? <Home size={12} /> : <MapPin size={12} />}
              {CATEGORY_LABEL[ev.category]}
            </span>
            <button className={styles.eventDelete} onClick={() => onRemoveEvent(ev)} title="Retirer cet événement">
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {showAddEvent && (
          <div className={styles.form}>
            <input
              className={styles.inputEl}
              placeholder="Titre de l'événement"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
            <div className={styles.row2}>
              <select
                className={styles.selectEl}
                value={newEvent.category}
                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as EventCategory })}
              >
                <option value="obligation">Obligation</option>
                <option value="prevu">Prévu d&apos;avance</option>
                <option value="envie">Envie</option>
              </select>
              <select
                className={styles.selectEl}
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value as LocationKind })}
              >
                <option value="ville">Dans notre ville</option>
                <option value="exterieur">À l&apos;extérieur</option>
              </select>
            </div>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={submitNewEvent}>
              Ajouter
            </button>
          </div>
        )}

        {showIdeaPicker && (
          <div className={styles.pickList}>
            {backlogIdeas.length === 0 && (
              <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Le backlog d&apos;idées est vide.</div>
            )}
            {backlogIdeas.map((idea) => (
              <div
                className={styles.pickItem}
                key={idea.id}
                onClick={async () => {
                  await onPickIdea(idea.id);
                  setShowIdeaPicker(false);
                }}
              >
                <span>{idea.title}</span>
                <span className={styles.chip}>{idea.duration}</span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.btnRow}>
          <button
            className={styles.btn}
            onClick={() => {
              setShowAddEvent((s) => !s);
              setShowIdeaPicker(false);
            }}
          >
            <Plus size={14} /> Ajouter un événement
          </button>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => {
              setShowIdeaPicker((s) => !s);
              setShowAddEvent(false);
            }}
          >
            <Sparkles size={14} /> Piger une idée du backlog
          </button>
          {selected.status !== "occupe" && selected.events.length === 0 && (
            <button className={styles.btn} onClick={onToggleProtected}>
              <ShieldCheck size={14} /> {selected.status === "protege" ? "Retirer la protection" : "Marquer comme protégé"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
