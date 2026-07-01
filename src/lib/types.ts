export type EventCategory = "obligation" | "prevu" | "envie";
export type LocationKind = "ville" | "exterieur";
export type IdeaStatus = "backlog" | "planifiee";
export type IdeaTag = "Nature" | "Bouffe" | "Voyage" | "Culture" | "Détente";
export type IdeaDuration =
  | "Quelques heures"
  | "1 jour"
  | "Soirée"
  | "Week-end complet"
  | "Plusieurs jours";
export type WeekendStatus = "libre" | "protege" | "partiel" | "occupe";

export const IDEA_TAGS: IdeaTag[] = ["Nature", "Bouffe", "Voyage", "Culture", "Détente"];
export const IDEA_DURATIONS: IdeaDuration[] = [
  "Quelques heures",
  "1 jour",
  "Soirée",
  "Week-end complet",
  "Plusieurs jours",
];

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  obligation: "Obligation",
  prevu: "Prévu d'avance",
  envie: "Envie",
};

/** Row shapes as stored in Supabase (snake_case, matches SQL schema). */
export interface EventRow {
  id: string;
  title: string;
  category: EventCategory;
  location: LocationKind;
  start_date: string;
  end_date: string;
  idea_id: string | null;
  recurring_rule_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface IdeaRow {
  id: string;
  title: string;
  tag: IdeaTag;
  duration: IdeaDuration;
  location: LocationKind;
  status: IdeaStatus;
  assigned_weekend_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface RecurringRuleRow {
  id: string;
  title: string;
  month: number;
  day: number;
  location: LocationKind;
  created_by: string | null;
  created_at: string;
}

export interface ProtectedWeekendRow {
  weekend_id: string;
  protected_by: string | null;
  created_at: string;
}

export interface SkippedRecurringInstanceRow {
  recurring_rule_id: string;
  year: number;
}

/** Unified event shape used by the planning logic (real DB rows + generated recurring instances). */
export interface PlannerEvent {
  id: string;
  title: string;
  category: EventCategory;
  location: LocationKind;
  start: string;
  end: string;
  ideaId: string | null;
  recurringRuleId: string | null;
  /** True for events synthesized from a recurring rule (never stored in `events`). */
  isGenerated: boolean;
}

export interface Weekend {
  id: string;
  sat: Date;
  sun: Date;
  month: number;
  year: number;
}

export interface ComputedWeekend extends Weekend {
  events: PlannerEvent[];
  status: WeekendStatus;
}
