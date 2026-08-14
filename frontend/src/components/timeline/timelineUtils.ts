// Layout + date math for the critical-path timeline.
//
// Pure functions only — no React, no hardcoded project content. Everything is
// derived from the TimelineEvent[] the project context hands in, so the same
// logic renders any project's schedule.

import type { TimelineEvent } from "@/lib/types";

const DAY_MS = 1000 * 60 * 60 * 24;
const WEEK_MS = DAY_MS * 7;

/** Parse an ISO date as UTC midnight so positions never shift by timezone. */
export function parseUTC(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** "Oct 14, 2026" — sentence-friendly, no ordinal, stable in UTC. */
export function formatNiceDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseUTC(iso));
}

/** Absolute whole-ish weeks between two ISO dates (one decimal). */
export function weeksBetween(a: string, b: string): number {
  const diff = Math.abs(parseUTC(b).getTime() - parseUTC(a).getTime());
  return Math.round((diff / WEEK_MS) * 10) / 10;
}

/** Whole months between two ISO dates (rounded), for the runway annotation. */
export function monthsBetween(a: string, b: string): number {
  const diff = Math.abs(parseUTC(b).getTime() - parseUTC(a).getTime());
  return Math.round(diff / (DAY_MS * 30.44));
}

export type TimelineNode = {
  event: TimelineEvent;
  /** Fractional position 0..1 across the min→max date range. */
  pos: number;
  isDeadline: boolean;
  /** True when this node participates in a scheduling conflict. */
  conflicted: boolean;
  /** Stacking lane for its label (milestones only). */
  lane: number;
  /** Left edge of the label box as a fraction, pre-clamped to the track. */
  labelStart: number;
};

export type ConflictPair = {
  from: TimelineNode;
  to: TimelineNode;
  earlier: TimelineNode;
  later: TimelineNode;
  weeks: number;
};

export type TimelineModel = {
  milestones: TimelineNode[];
  deadline: TimelineNode | null;
  conflicts: ConflictPair[];
  laneCount: number;
  minDate: string;
  maxDate: string;
};

/**
 * Greedy interval-partition lane packing so labels don't collide. Each label is
 * treated as a fixed-width box centred on its node and clamped to the track.
 */
function assignLanes(nodes: TimelineNode[], widthFrac: number): number {
  const gap = 0.01;
  const laneEnds: number[] = [];
  for (const node of nodes) {
    const half = widthFrac / 2;
    const start = Math.max(0, Math.min(1 - widthFrac, node.pos - half));
    node.labelStart = start;
    const end = start + widthFrac + gap;
    let lane = 0;
    while (lane < laneEnds.length && laneEnds[lane] > start + 1e-6) lane++;
    node.lane = lane;
    laneEnds[lane] = end;
  }
  return laneEnds.length;
}

/**
 * Build the full timeline layout model from raw events.
 * @param labelWidthFrac fraction of the track a single label box occupies.
 */
export function buildTimelineModel(
  events: TimelineEvent[],
  labelWidthFrac = 0.17,
): TimelineModel {
  const sorted = [...events].sort(
    (a, b) => parseUTC(a.date).getTime() - parseUTC(b.date).getTime(),
  );

  const times = sorted.map((e) => parseUTC(e.date).getTime());
  const min = Math.min(...times);
  const max = Math.max(...times);
  const span = Math.max(1, max - min);

  const nodes: TimelineNode[] = sorted.map((event) => ({
    event,
    pos: (parseUTC(event.date).getTime() - min) / span,
    isDeadline: event.kind === "deadline",
    conflicted: false,
    lane: 0,
    labelStart: 0,
  }));

  const byLabel = new Map(nodes.map((n) => [n.event.label, n]));

  const conflicts: ConflictPair[] = [];
  for (const node of nodes) {
    const targetLabel = node.event.conflictsWith;
    if (!targetLabel) continue;
    const target = byLabel.get(targetLabel);
    if (!target) continue;
    node.conflicted = true;
    target.conflicted = true;
    const [earlier, later] =
      node.pos <= target.pos ? [node, target] : [target, node];
    conflicts.push({
      from: node,
      to: target,
      earlier,
      later,
      weeks: weeksBetween(node.event.date, target.event.date),
    });
  }

  const milestones = nodes.filter((n) => !n.isDeadline);
  const deadline = nodes.find((n) => n.isDeadline) ?? null;
  const laneCount = assignLanes(milestones, labelWidthFrac);

  return {
    milestones,
    deadline,
    conflicts,
    laneCount: Math.max(1, laneCount),
    minDate: sorted[0]?.date ?? "",
    maxDate: sorted[sorted.length - 1]?.date ?? "",
  };
}
