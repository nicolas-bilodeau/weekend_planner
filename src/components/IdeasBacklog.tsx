"use client";

import { useState } from "react";
import { ArrowRight, Calendar, Clock, Home, MapPin, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { formatLabel } from "@/lib/weekends";
import { IDEA_DURATIONS, IDEA_TAGS } from "@/lib/types";
import type { ComputedWeekend, IdeaDuration, IdeaRow, IdeaTag, LocationKind } from "@/lib/types";
import type { NewIdeaInput } from "@/hooks/usePlannerData";
import { EmptyState } from "./StateCards";
import styles from "./planner.module.css";

const TAG_CHIP_CLASS: Record<IdeaTag, string> = {
  Nature: styles.chipNature,
  Bouffe: styles.chipBouffe,
  Voyage: styles.chipVoyage,
  Culture: styles.chipCulture,
  Détente: styles.chipDetente,
};

const LOCATION_CHIP_CLASS: Record<LocationKind, string> = {
  ville: styles.chipVille,
  exterieur: styles.chipExterieur,
};

export function IdeasBacklog({
  ideas,
  computed,
  onSubmitNewIdea,
  onDeleteIdea,
  onUnassignIdea,
  onOpenAssign,
}: {
  ideas: IdeaRow[];
  computed: ComputedWeekend[];
  onSubmitNewIdea: (input: NewIdeaInput) => Promise<void>;
  onDeleteIdea: (ideaId: string) => Promise<void>;
  onUnassignIdea: (ideaId: string) => Promise<void>;
  onOpenAssign: (ideaId: string) => void;
}) {
  const [showNewIdea, setShowNewIdea] = useState(false);
  const [newIdea, setNewIdea] = useState<{
    title: string;
    tag: IdeaTag;
    duration: IdeaDuration;
    location: LocationKind;
  }>({ title: "", tag: IDEA_TAGS[0], duration: IDEA_DURATIONS[0], location: "ville" });

  async function submit() {
    if (!newIdea.title.trim()) return;
    await onSubmitNewIdea({ ...newIdea, title: newIdea.title.trim() });
    setNewIdea({ title: "", tag: IDEA_TAGS[0], duration: IDEA_DURATIONS[0], location: "ville" });
    setShowNewIdea(false);
  }

  return (
    <div className={styles.ideasWrap}>
      <div className={styles.ideasHead}>
        <div className={styles.sectionLabel} style={{ margin: 0 }}>
          Backlog d&apos;inspiration
        </div>
        <button className={`${styles.btn} ${styles.btnSmall}`} onClick={() => setShowNewIdea((s) => !s)}>
          <Plus size={14} /> Nouvelle idée
        </button>
      </div>

      {showNewIdea && (
        <div className={styles.form} style={{ marginBottom: 18 }}>
          <input
            className={styles.inputEl}
            placeholder="Ex. Souper à la cabane à sucre"
            value={newIdea.title}
            onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
          />
          <div className={styles.row2}>
            <select
              className={styles.selectEl}
              value={newIdea.tag}
              onChange={(e) => setNewIdea({ ...newIdea, tag: e.target.value as IdeaTag })}
            >
              {IDEA_TAGS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className={styles.selectEl}
              value={newIdea.duration}
              onChange={(e) => setNewIdea({ ...newIdea, duration: e.target.value as IdeaDuration })}
            >
              {IDEA_DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <select
            className={styles.selectEl}
            value={newIdea.location}
            onChange={(e) => setNewIdea({ ...newIdea, location: e.target.value as LocationKind })}
          >
            <option value="ville">Dans notre ville</option>
            <option value="exterieur">À l&apos;extérieur</option>
          </select>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={submit}>
            Ajouter au backlog
          </button>
        </div>
      )}

      {ideas.length === 0 && (
        <EmptyState
          title="Le backlog est vide"
          subtitle="Ajoute une idée pour commencer à rêver de fins de semaine."
        />
      )}

      <div className={styles.ideaGrid}>
        {ideas.map((idea) => {
          const assignedW = idea.assigned_weekend_id
            ? computed.find((w) => w.id === idea.assigned_weekend_id) ?? null
            : null;
          return (
            <div className={`${styles.ideaCard} ${assignedW ? styles.ideaCardAssigned : ""}`} key={idea.id}>
              <button
                className={styles.ideaDelete}
                onClick={() => onDeleteIdea(idea.id)}
                title="Supprimer cette idée"
              >
                <Trash2 size={15} />
              </button>
              <div className={styles.ideaTitle}>{idea.title}</div>
              <div className={styles.ideaMetaRow}>
                <span className={`${styles.chip} ${assignedW ? styles.chipOnAccent : TAG_CHIP_CLASS[idea.tag]}`}>
                  <TagIcon size={10} /> {idea.tag}
                </span>
                <span className={`${styles.chip} ${assignedW ? styles.chipOnAccent : ""}`}>
                  <Clock size={10} /> {idea.duration}
                </span>
                <span
                  className={`${styles.chip} ${assignedW ? styles.chipOnAccent : LOCATION_CHIP_CLASS[idea.location]}`}
                >
                  {idea.location === "ville" ? <Home size={10} /> : <MapPin size={10} />}{" "}
                  {idea.location === "ville" ? "Ville" : "Extérieur"}
                </span>
              </div>
              {assignedW ? (
                <>
                  <div className={styles.ideaAssigned}>
                    <ArrowRight size={13} /> Assignée au {formatLabel(assignedW)}
                  </div>
                  <button className={`${styles.btn} ${styles.btnSmall}`} onClick={() => onUnassignIdea(idea.id)}>
                    Retirer du calendrier
                  </button>
                </>
              ) : (
                <button className={`${styles.btn} ${styles.btnSmall}`} onClick={() => onOpenAssign(idea.id)}>
                  <Calendar size={13} /> Assigner à un week-end
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
