import { describe, expect, it } from "vitest";
import {
  computeOccupancy,
  computeWeekendStatuses,
  findViolations,
  formatLabel,
  generateRecurringEvents,
  getWeekendsOfYear,
  isoDate,
  nearestWeekend,
  overlaps,
  violationKey,
} from "./weekends";
import type { PlannerEvent, RecurringRuleRow, SkippedRecurringInstanceRow, Weekend } from "./types";

function event(partial: Partial<PlannerEvent> & Pick<PlannerEvent, "start">): PlannerEvent {
  return {
    id: "e1",
    title: "Test",
    category: "obligation",
    location: "exterieur",
    start: partial.start,
    end: partial.start,
    ideaId: null,
    recurringRuleId: null,
    isGenerated: false,
    ...partial,
  };
}

describe("getWeekendsOfYear", () => {
  it("only returns Saturdays and Sundays within the given year", () => {
    const weekends = getWeekendsOfYear(2026);
    for (const w of weekends) {
      expect(w.sat.getDay()).toBe(6);
      expect(w.sun.getDay()).toBe(0);
      expect(w.sat.getFullYear()).toBe(2026);
    }
  });

  it("produces 52 or 53 weekends for a full year", () => {
    const weekends = getWeekendsOfYear(2026);
    expect(weekends.length).toBeGreaterThanOrEqual(52);
    expect(weekends.length).toBeLessThanOrEqual(53);
  });
});

describe("formatLabel", () => {
  it("formats same-month weekends compactly", () => {
    const weekends = getWeekendsOfYear(2026);
    const w = weekends.find((x) => x.sat.getMonth() === x.sun.getMonth())!;
    expect(formatLabel(w)).toMatch(/^\d+-\d+ /);
  });

  it("formats month-straddling weekends with both months", () => {
    const w: Weekend = {
      id: "2026-01-31",
      sat: new Date(2026, 0, 31),
      sun: new Date(2026, 1, 1),
      month: 0,
      year: 2026,
    };
    expect(formatLabel(w)).toBe("31 Janv – 1 Févr");
  });
});

describe("overlaps", () => {
  it("matches an event that spans the weekend", () => {
    const w = getWeekendsOfYear(2026)[10];
    const ev = event({ start: isoDate(w.sat), end: isoDate(w.sun) });
    expect(overlaps(ev, w)).toBe(true);
  });

  it("does not match an event entirely before or after the weekend", () => {
    const w = getWeekendsOfYear(2026)[10];
    const before = new Date(w.sat);
    before.setDate(before.getDate() - 10);
    const ev = event({ start: isoDate(before), end: isoDate(before) });
    expect(overlaps(ev, w)).toBe(false);
  });
});

describe("nearestWeekend", () => {
  it("finds the closest weekend to a fixed date, e.g. Dec 24", () => {
    const weekendsOfYear = getWeekendsOfYear(2026);
    const w = nearestWeekend(2026, 12, 24, weekendsOfYear)!;
    const dec24 = new Date(2026, 11, 24);
    const dist = Math.min(
      Math.abs(dec24.getTime() - w.sat.getTime()),
      Math.abs(dec24.getTime() - w.sun.getTime())
    );
    for (const other of weekendsOfYear) {
      const otherDist = Math.min(
        Math.abs(dec24.getTime() - other.sat.getTime()),
        Math.abs(dec24.getTime() - other.sun.getTime())
      );
      expect(otherDist).toBeGreaterThanOrEqual(dist);
    }
  });
});

describe("computeWeekendStatuses", () => {
  const weekends = getWeekendsOfYear(2026).slice(0, 4);

  it("prioritizes occupe over protege even when protected", () => {
    const w = weekends[0];
    const ev = event({ start: isoDate(w.sat), end: isoDate(w.sun), location: "exterieur" });
    const computed = computeWeekendStatuses([w], [ev], new Set([w.id]));
    expect(computed[0].status).toBe("occupe");
  });

  it("marks protege only when no events at all", () => {
    const w = weekends[0];
    const computed = computeWeekendStatuses([w], [], new Set([w.id]));
    expect(computed[0].status).toBe("protege");
  });

  it("marks partiel for local-only events without protection", () => {
    const w = weekends[0];
    const ev = event({ start: isoDate(w.sat), end: isoDate(w.sun), location: "ville" });
    const computed = computeWeekendStatuses([w], [ev], new Set());
    expect(computed[0].status).toBe("partiel");
  });

  it("marks libre with nothing going on", () => {
    const w = weekends[0];
    const computed = computeWeekendStatuses([w], [], new Set());
    expect(computed[0].status).toBe("libre");
  });
});

describe("findViolations", () => {
  it("flags two consecutive occupe weekends", () => {
    const weekends = getWeekendsOfYear(2026).slice(0, 3);
    const events = [
      event({ id: "a", start: isoDate(weekends[0].sat), end: isoDate(weekends[0].sun), location: "exterieur" }),
      event({ id: "b", start: isoDate(weekends[1].sat), end: isoDate(weekends[1].sun), location: "exterieur" }),
    ];
    const computed = computeWeekendStatuses(weekends, events, new Set());
    const violations = findViolations(computed);
    expect(violations).toHaveLength(1);
    expect(violationKey(violations[0][0], violations[0][1])).toBe(
      weekends[0].id + "_" + weekends[1].id
    );
  });

  it("does not flag occupe weekends separated by a free one", () => {
    const weekends = getWeekendsOfYear(2026).slice(0, 3);
    const events = [
      event({ id: "a", start: isoDate(weekends[0].sat), end: isoDate(weekends[0].sun), location: "exterieur" }),
      event({ id: "b", start: isoDate(weekends[2].sat), end: isoDate(weekends[2].sun), location: "exterieur" }),
    ];
    const computed = computeWeekendStatuses(weekends, events, new Set());
    expect(findViolations(computed)).toHaveLength(0);
  });
});

describe("computeOccupancy", () => {
  it("reflects only the given scope, not a global total", () => {
    const weekends2026 = getWeekendsOfYear(2026).slice(0, 4);
    const events = [
      event({ start: isoDate(weekends2026[0].sat), end: isoDate(weekends2026[0].sun), location: "exterieur" }),
    ];
    const computed = computeWeekendStatuses(weekends2026, events, new Set());
    const { occupied, total, percent } = computeOccupancy(computed);
    expect(occupied).toBe(1);
    expect(total).toBe(4);
    expect(percent).toBe(25);
  });
});

describe("generateRecurringEvents", () => {
  const rule: RecurringRuleRow = {
    id: "r1",
    title: "Noël",
    month: 12,
    day: 24,
    location: "exterieur",
    created_by: null,
    created_at: "",
  };
  const weekendsByYear = { 2026: getWeekendsOfYear(2026), 2027: getWeekendsOfYear(2027) };

  it("generates one event per rule per year in the window", () => {
    const out = generateRecurringEvents([rule], [2026, 2027], [], weekendsByYear);
    expect(out).toHaveLength(2);
    expect(out.every((e) => e.isGenerated)).toBe(true);
  });

  it("excludes a skipped year without dropping other years", () => {
    const skipped: SkippedRecurringInstanceRow[] = [{ recurring_rule_id: "r1", year: 2026 }];
    const out = generateRecurringEvents([rule], [2026, 2027], skipped, weekendsByYear);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("rec-r1-2027");
  });
});
