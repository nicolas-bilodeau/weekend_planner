"use client";

import { useMemo, useState } from "react";
import {
  computeOccupancy,
  computeWeekendStatuses,
  eventRowToPlannerEvent,
  findViolations,
  generateRecurringEvents,
  getPlannerYears,
  getWeekendsOfYear,
  isoDate,
  protectedRowsToSet,
  violationKey,
} from "@/lib/weekends";
import type { ComputedWeekend, PlannerEvent, Weekend } from "@/lib/types";
import { usePlannerData } from "@/hooks/usePlannerData";
import { Header, type Tab } from "./Header";
import { ViolationBanner } from "./ViolationBanner";
import { AnnualGrid } from "./AnnualGrid";
import { WeekendDrawer } from "./WeekendDrawer";
import { IdeaAssignDrawer } from "./IdeaAssignDrawer";
import { IdeasBacklog } from "./IdeasBacklog";
import { RecurringRules } from "./RecurringRules";
import { ErrorState, LoadingState } from "./StateCards";
import styles from "./planner.module.css";

export function PlannerApp() {
  const {
    loading,
    error,
    dismissError,
    loadError,
    retry,
    events,
    ideas,
    recurringRules,
    protectedWeekends,
    skippedInstances,
    actions,
  } = usePlannerData();

  const [tab, setTab] = useState<Tab>("grid");
  const [yearFilter, setYearFilter] = useState<"both" | number>("both");
  const [hidePast, setHidePast] = useState(true);
  const [dismissedViolations, setDismissedViolations] = useState<Set<string>>(new Set());
  const [selectedWeekendId, setSelectedWeekendId] = useState<string | null>(null);
  const [assigningIdeaId, setAssigningIdeaId] = useState<string | null>(null);

  const years = useMemo(() => getPlannerYears(), []);

  const weekendsByYear = useMemo(() => {
    const m: Record<number, Weekend[]> = {};
    years.forEach((y) => {
      m[y] = getWeekendsOfYear(y);
    });
    return m;
  }, [years]);

  const generatedEvents = useMemo(
    () => generateRecurringEvents(recurringRules, years, skippedInstances, weekendsByYear),
    [recurringRules, years, skippedInstances, weekendsByYear]
  );

  const allEvents: PlannerEvent[] = useMemo(
    () => [...events.map(eventRowToPlannerEvent), ...generatedEvents],
    [events, generatedEvents]
  );

  const protectedIds = useMemo(() => protectedRowsToSet(protectedWeekends), [protectedWeekends]);

  const computed = useMemo(() => {
    const flat = years.flatMap((y) => weekendsByYear[y]);
    return computeWeekendStatuses(flat, allEvents, protectedIds);
  }, [years, weekendsByYear, allEvents, protectedIds]);

  const violations = useMemo(() => findViolations(computed), [computed]);
  const visibleViolations = violations.filter(([a, b]) => !dismissedViolations.has(violationKey(a, b)));

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const ratioScope = useMemo(
    () => computed.filter((w) => yearFilter === "both" || w.year === yearFilter),
    [computed, yearFilter]
  );
  const occupancy = computeOccupancy(ratioScope);

  const visibleWeekends = useMemo(
    () =>
      computed.filter((w) => {
        if (yearFilter !== "both" && w.year !== yearFilter) return false;
        if (hidePast && w.sun < today) return false;
        return true;
      }),
    [computed, yearFilter, hidePast, today]
  );

  const byMonth = useMemo(() => {
    const map: Record<string, { year: number; month: number; weekends: ComputedWeekend[] }> = {};
    visibleWeekends.forEach((w) => {
      const key = `${w.year}-${w.month}`;
      if (!map[key]) map[key] = { year: w.year, month: w.month, weekends: [] };
      map[key].weekends.push(w);
    });
    return Object.values(map).sort((a, b) => a.year - b.year || a.month - b.month);
  }, [visibleWeekends]);

  const selected = computed.find((w) => w.id === selectedWeekendId) ?? null;
  const backlogIdeas = ideas.filter((i) => i.status === "backlog");
  const assigningIdea = ideas.find((i) => i.id === assigningIdeaId) ?? null;

  const assignCandidates = useMemo(
    () =>
      computed.filter(
        (w) => (w.status === "libre" || w.status === "partiel" || w.status === "protege") && w.sun >= today
      ),
    [computed, today]
  );

  function dismissAllVisible() {
    setDismissedViolations((prev) => {
      const next = new Set(prev);
      visibleViolations.forEach(([a, b]) => next.add(violationKey(a, b)));
      return next;
    });
  }

  if (loading) {
    return (
      <div className={styles.centered}>
        <div style={{ width: "min(360px, 90vw)" }}>
          <LoadingState />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.centered}>
        <div style={{ width: "min(360px, 90vw)" }}>
          <ErrorState onRetry={retry} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <Header
        tab={tab}
        onTabChange={setTab}
        occupied={occupancy.occupied}
        total={occupancy.total}
        percent={occupancy.percent}
        yearLabel={yearFilter === "both" ? years.join("-") : String(yearFilter)}
        backlogCount={backlogIdeas.length}
      />

      {error && (
        <div className={styles.alertBanner} style={{ maxWidth: 1040 }}>
          <div>{error}</div>
          <button className={styles.alertClose} onClick={dismissError}>
            ×
          </button>
        </div>
      )}

      <ViolationBanner violations={visibleViolations} onDismissAll={dismissAllVisible} />

      {tab === "grid" && (
        <AnnualGrid
          years={years}
          yearFilter={yearFilter}
          onYearFilterChange={setYearFilter}
          hidePast={hidePast}
          onHidePastChange={setHidePast}
          byMonth={byMonth}
          selectedId={selectedWeekendId}
          onSelectWeekend={setSelectedWeekendId}
        />
      )}

      {tab === "ideas" && (
        <IdeasBacklog
          ideas={ideas}
          computed={computed}
          onSubmitNewIdea={actions.submitNewIdea}
          onDeleteIdea={actions.deleteIdea}
          onUnassignIdea={actions.unassignIdea}
          onOpenAssign={setAssigningIdeaId}
        />
      )}

      {tab === "rules" && (
        <RecurringRules
          rules={recurringRules}
          years={years}
          weekendsByYear={weekendsByYear}
          skippedInstances={skippedInstances}
          onSubmitNewRule={actions.submitNewRule}
          onDeleteRule={actions.deleteRule}
        />
      )}

      {assigningIdea && (
        <IdeaAssignDrawer
          candidates={assignCandidates}
          onClose={() => setAssigningIdeaId(null)}
          onPick={async (weekendId) => {
            const w = computed.find((x) => x.id === weekendId);
            if (!w) return;
            await actions.assignIdeaToWeekend(assigningIdea, weekendId, isoDate(w.sun));
            setAssigningIdeaId(null);
          }}
        />
      )}

      {selected && (
        <WeekendDrawer
          selected={selected}
          isPartOfViolation={violations.some(([a, b]) => a.id === selected.id || b.id === selected.id)}
          backlogIdeas={backlogIdeas}
          onClose={() => setSelectedWeekendId(null)}
          onAddEvent={actions.addEvent}
          onRemoveEvent={actions.removeEvent}
          onToggleProtected={() => actions.toggleProtected(selected.id, protectedIds.has(selected.id))}
          onPickIdea={async (ideaId) => {
            const idea = ideas.find((i) => i.id === ideaId);
            if (!idea) return;
            await actions.assignIdeaToWeekend(idea, selected.id, isoDate(selected.sun));
          }}
        />
      )}
    </div>
  );
}
