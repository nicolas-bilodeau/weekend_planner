"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type {
  EventCategory,
  EventRow,
  IdeaDuration,
  IdeaRow,
  IdeaTag,
  LocationKind,
  PlannerEvent,
  ProtectedWeekendRow,
  RecurringRuleRow,
  SkippedRecurringInstanceRow,
} from "@/lib/types";

function upsertBy<T>(rows: T[], row: T, matches: (r: T) => boolean): T[] {
  const idx = rows.findIndex(matches);
  if (idx === -1) return [...rows, row];
  const next = rows.slice();
  next[idx] = row;
  return next;
}

function removeBy<T>(rows: T[], matches: (r: T) => boolean): T[] {
  return rows.filter((r) => !matches(r));
}

export interface NewEventInput {
  title: string;
  category: EventCategory;
  location: LocationKind;
  startDate: string;
  endDate: string;
  ideaId?: string | null;
}

export interface NewIdeaInput {
  title: string;
  tag: IdeaTag;
  duration: IdeaDuration;
  location: LocationKind;
}

export interface NewRuleInput {
  title: string;
  month: number;
  day: number;
  location: LocationKind;
}

export function usePlannerData() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRuleRow[]>([]);
  const [protectedWeekends, setProtectedWeekends] = useState<ProtectedWeekendRow[]>([]);
  const [skippedInstances, setSkippedInstances] = useState<SkippedRecurringInstanceRow[]>([]);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      const [
        { data: userData },
        eventsRes,
        ideasRes,
        rulesRes,
        protectedRes,
        skippedRes,
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("events").select("*"),
        supabase.from("ideas").select("*"),
        supabase.from("recurring_rules").select("*"),
        supabase.from("protected_weekends").select("*"),
        supabase.from("skipped_recurring_instances").select("*"),
      ]);
      if (cancelled) return;

      userIdRef.current = userData.user?.id ?? null;

      const firstError =
        eventsRes.error || ideasRes.error || rulesRes.error || protectedRes.error || skippedRes.error;
      if (firstError) {
        setLoadError(firstError.message);
        setLoading(false);
        return;
      }

      setEvents((eventsRes.data as EventRow[]) ?? []);
      setIdeas((ideasRes.data as IdeaRow[]) ?? []);
      setRecurringRules((rulesRes.data as RecurringRuleRow[]) ?? []);
      setProtectedWeekends((protectedRes.data as ProtectedWeekendRow[]) ?? []);
      setSkippedInstances((skippedRes.data as SkippedRecurringInstanceRow[]) ?? []);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("planner-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        (payload: RealtimePostgresChangesPayload<EventRow>) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as Partial<EventRow>).id;
            setEvents((rows) => removeBy(rows, (r) => r.id === oldId));
          } else {
            const row = payload.new as EventRow;
            setEvents((rows) => upsertBy(rows, row, (r) => r.id === row.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ideas" },
        (payload: RealtimePostgresChangesPayload<IdeaRow>) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as Partial<IdeaRow>).id;
            setIdeas((rows) => removeBy(rows, (r) => r.id === oldId));
          } else {
            const row = payload.new as IdeaRow;
            setIdeas((rows) => upsertBy(rows, row, (r) => r.id === row.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recurring_rules" },
        (payload: RealtimePostgresChangesPayload<RecurringRuleRow>) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as Partial<RecurringRuleRow>).id;
            setRecurringRules((rows) => removeBy(rows, (r) => r.id === oldId));
          } else {
            const row = payload.new as RecurringRuleRow;
            setRecurringRules((rows) => upsertBy(rows, row, (r) => r.id === row.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "protected_weekends" },
        (payload: RealtimePostgresChangesPayload<ProtectedWeekendRow>) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as Partial<ProtectedWeekendRow>).weekend_id;
            setProtectedWeekends((rows) => removeBy(rows, (r) => r.weekend_id === oldId));
          } else {
            const row = payload.new as ProtectedWeekendRow;
            setProtectedWeekends((rows) => upsertBy(rows, row, (r) => r.weekend_id === row.weekend_id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "skipped_recurring_instances" },
        (payload: RealtimePostgresChangesPayload<SkippedRecurringInstanceRow>) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as Partial<SkippedRecurringInstanceRow>;
            setSkippedInstances((rows) =>
              removeBy(rows, (r) => r.recurring_rule_id === old.recurring_rule_id && r.year === old.year)
            );
          } else {
            const row = payload.new as SkippedRecurringInstanceRow;
            setSkippedInstances((rows) =>
              upsertBy(rows, row, (r) => r.recurring_rule_id === row.recurring_rule_id && r.year === row.year)
            );
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, retryToken]);

  const retry = useCallback(() => setRetryToken((t) => t + 1), []);

  const addEvent = useCallback(
    async (input: NewEventInput) => {
      const { error: err } = await supabase.from("events").insert({
        title: input.title,
        category: input.category,
        location: input.location,
        start_date: input.startDate,
        end_date: input.endDate,
        idea_id: input.ideaId ?? null,
        recurring_rule_id: null,
        created_by: userIdRef.current,
      });
      if (err) setError(err.message);
    },
    [supabase]
  );

  const removeEvent = useCallback(
    async (event: Pick<PlannerEvent, "id" | "ideaId" | "recurringRuleId" | "start" | "isGenerated">) => {
      if (event.isGenerated && event.recurringRuleId) {
        const year = Number(event.start.slice(0, 4));
        const { error: err } = await supabase
          .from("skipped_recurring_instances")
          .insert({ recurring_rule_id: event.recurringRuleId, year });
        if (err) setError(err.message);
        return;
      }
      if (event.ideaId) {
        const { error: ideaErr } = await supabase
          .from("ideas")
          .update({ status: "backlog", assigned_weekend_id: null })
          .eq("id", event.ideaId);
        if (ideaErr) setError(ideaErr.message);
      }
      const { error: err } = await supabase.from("events").delete().eq("id", event.id);
      if (err) setError(err.message);
    },
    [supabase]
  );

  const toggleProtected = useCallback(
    async (weekendId: string, currentlyProtected: boolean) => {
      if (currentlyProtected) {
        const { error: err } = await supabase
          .from("protected_weekends")
          .delete()
          .eq("weekend_id", weekendId);
        if (err) setError(err.message);
      } else {
        const { error: err } = await supabase
          .from("protected_weekends")
          .insert({ weekend_id: weekendId, protected_by: userIdRef.current });
        if (err) setError(err.message);
      }
    },
    [supabase]
  );

  const submitNewIdea = useCallback(
    async (input: NewIdeaInput) => {
      const { error: err } = await supabase.from("ideas").insert({
        title: input.title,
        tag: input.tag,
        duration: input.duration,
        location: input.location,
        status: "backlog",
        assigned_weekend_id: null,
        created_by: userIdRef.current,
      });
      if (err) setError(err.message);
    },
    [supabase]
  );

  const deleteIdea = useCallback(
    async (ideaId: string) => {
      const { error: evErr } = await supabase.from("events").delete().eq("idea_id", ideaId);
      if (evErr) setError(evErr.message);
      const { error: err } = await supabase.from("ideas").delete().eq("id", ideaId);
      if (err) setError(err.message);
    },
    [supabase]
  );

  const assignIdeaToWeekend = useCallback(
    async (idea: IdeaRow, weekendId: string, weekendSundayIso: string) => {
      const { error: evErr } = await supabase.from("events").insert({
        title: idea.title,
        category: "envie",
        location: idea.location,
        start_date: weekendId,
        end_date: weekendSundayIso,
        idea_id: idea.id,
        recurring_rule_id: null,
        created_by: userIdRef.current,
      });
      if (evErr) {
        setError(evErr.message);
        return;
      }
      const { error: ideaErr } = await supabase
        .from("ideas")
        .update({ status: "planifiee", assigned_weekend_id: weekendId })
        .eq("id", idea.id);
      if (ideaErr) setError(ideaErr.message);
    },
    [supabase]
  );

  const unassignIdea = useCallback(
    async (ideaId: string) => {
      const { error: evErr } = await supabase.from("events").delete().eq("idea_id", ideaId);
      if (evErr) setError(evErr.message);
      const { error: err } = await supabase
        .from("ideas")
        .update({ status: "backlog", assigned_weekend_id: null })
        .eq("id", ideaId);
      if (err) setError(err.message);
    },
    [supabase]
  );

  const submitNewRule = useCallback(
    async (input: NewRuleInput) => {
      const { error: err } = await supabase.from("recurring_rules").insert({
        title: input.title,
        month: input.month,
        day: input.day,
        location: input.location,
        created_by: userIdRef.current,
      });
      if (err) setError(err.message);
    },
    [supabase]
  );

  const deleteRule = useCallback(
    async (ruleId: string) => {
      const { error: err } = await supabase.from("recurring_rules").delete().eq("id", ruleId);
      if (err) setError(err.message);
    },
    [supabase]
  );

  return {
    loading,
    error,
    dismissError: () => setError(null),
    loadError,
    retry,
    events,
    ideas,
    recurringRules,
    protectedWeekends,
    skippedInstances,
    actions: {
      addEvent,
      removeEvent,
      toggleProtected,
      submitNewIdea,
      deleteIdea,
      assignIdeaToWeekend,
      unassignIdea,
      submitNewRule,
      deleteRule,
    },
  };
}
