import type {
  ComputedWeekend,
  EventRow,
  IdeaRow,
  PlannerEvent,
  ProtectedWeekendRow,
  RecurringRuleRow,
  SkippedRecurringInstanceRow,
  Weekend,
  WeekendStatus,
} from "./types";

export const MONTHS_ABBR = [
  "Janv", "Févr", "Mars", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sept", "Oct", "Nov", "Déc",
];

export const MONTHS_FULL = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function pad(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}

export function isoDate(d: Date): string {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

/** Both years in the sliding window: the current year and the next one. */
export function getPlannerYears(referenceDate: Date = new Date()): [number, number] {
  const y = referenceDate.getFullYear();
  return [y, y + 1];
}

/** Every Saturday/Sunday pair that falls within the given calendar year. */
export function getWeekendsOfYear(year: number): Weekend[] {
  const weekends: Weekend[] = [];
  const d = new Date(year, 0, 1);
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  while (d.getFullYear() === year) {
    const sat = new Date(d);
    const sun = new Date(d);
    sun.setDate(sun.getDate() + 1);
    weekends.push({ id: isoDate(sat), sat, sun, month: sat.getMonth(), year });
    d.setDate(d.getDate() + 7);
  }
  return weekends;
}

export function formatLabel(w: Weekend): string {
  const satDay = w.sat.getDate();
  const sunDay = w.sun.getDate();
  const satM = w.sat.getMonth();
  const sunM = w.sun.getMonth();
  if (satM === sunM) return `${satDay}-${sunDay} ${MONTHS_ABBR[satM]}`;
  return `${satDay} ${MONTHS_ABBR[satM]} – ${sunDay} ${MONTHS_ABBR[sunM]}`;
}

export function overlaps(ev: Pick<PlannerEvent, "start" | "end">, w: Weekend): boolean {
  const s = new Date(ev.start);
  const e = new Date(ev.end || ev.start);
  return s <= w.sun && e >= w.sat;
}

/** Finds the Saturday-or-Sunday closest to the target month/day within that year's weekends. */
export function nearestWeekend(
  year: number,
  month: number,
  day: number,
  weekendsOfYear: Weekend[]
): Weekend | null {
  const target = new Date(year, month - 1, day);
  let best: Weekend | null = null;
  let bestDist = Infinity;
  weekendsOfYear.forEach((w) => {
    const dist = Math.min(
      Math.abs(target.getTime() - w.sat.getTime()),
      Math.abs(target.getTime() - w.sun.getTime())
    );
    if (dist < bestDist) {
      bestDist = dist;
      best = w;
    }
  });
  return best;
}

export function eventRowToPlannerEvent(ev: EventRow): PlannerEvent {
  return {
    id: ev.id,
    title: ev.title,
    category: ev.category,
    location: ev.location,
    start: ev.start_date,
    end: ev.end_date,
    ideaId: ev.idea_id,
    recurringRuleId: ev.recurring_rule_id,
    isGenerated: false,
  };
}

/**
 * Synthesizes one event per recurring rule per year in the window, on the
 * weekend nearest the rule's target date. Skipped instances (one-off removed
 * occurrences) are excluded. These are never persisted — recomputed on every render.
 */
export function generateRecurringEvents(
  rules: RecurringRuleRow[],
  years: number[],
  skippedInstances: SkippedRecurringInstanceRow[],
  weekendsByYear: Record<number, Weekend[]>
): PlannerEvent[] {
  const skippedKeys = new Set(skippedInstances.map((s) => `${s.recurring_rule_id}-${s.year}`));
  const out: PlannerEvent[] = [];
  years.forEach((year) => {
    rules.forEach((rule) => {
      const key = `${rule.id}-${year}`;
      if (skippedKeys.has(key)) return;
      const w = nearestWeekend(year, rule.month, rule.day, weekendsByYear[year] ?? []);
      if (w) {
        out.push({
          id: `rec-${rule.id}-${year}`,
          title: rule.title,
          category: "obligation",
          location: rule.location,
          start: w.id,
          end: isoDate(w.sun),
          ideaId: null,
          recurringRuleId: rule.id,
          isGenerated: true,
        });
      }
    });
  });
  return out;
}

/**
 * Status priority: occupe (event outside town) > protege (manually marked,
 * no outside event) > partiel (local events only) > libre (nothing).
 */
export function computeWeekendStatuses(
  weekends: Weekend[],
  allEvents: PlannerEvent[],
  protectedIds: Set<string>
): ComputedWeekend[] {
  return weekends.map((w) => {
    const wEvents = allEvents.filter((ev) => overlaps(ev, w));
    const hasAway = wEvents.some((ev) => ev.location === "exterieur");
    let status: WeekendStatus = "libre";
    if (hasAway) status = "occupe";
    else if (protectedIds.has(w.id)) status = "protege";
    else if (wEvents.length > 0) status = "partiel";
    return { ...w, events: wEvents, status };
  });
}

export function protectedRowsToSet(rows: ProtectedWeekendRow[]): Set<string> {
  return new Set(rows.map((r) => r.weekend_id));
}

/** Consecutive pairs (in chronological order) that are both "occupe" — a broken rule. */
export function findViolations(computed: ComputedWeekend[]): [ComputedWeekend, ComputedWeekend][] {
  const v: [ComputedWeekend, ComputedWeekend][] = [];
  for (let i = 0; i < computed.length - 1; i++) {
    if (computed[i].status === "occupe" && computed[i + 1].status === "occupe") {
      v.push([computed[i], computed[i + 1]]);
    }
  }
  return v;
}

export function violationKey(a: ComputedWeekend, b: ComputedWeekend): string {
  return a.id + "_" + b.id;
}

export function computeOccupancy(scope: ComputedWeekend[]): {
  occupied: number;
  total: number;
  percent: number;
} {
  const occupied = scope.filter((w) => w.status === "occupe").length;
  const total = scope.length;
  const percent = total === 0 ? 0 : Math.round((occupied / total) * 100);
  return { occupied, total, percent };
}

export function ideaAssignedWeekend(
  idea: IdeaRow,
  computed: ComputedWeekend[]
): ComputedWeekend | null {
  if (!idea.assigned_weekend_id) return null;
  return computed.find((w) => w.id === idea.assigned_weekend_id) ?? null;
}
