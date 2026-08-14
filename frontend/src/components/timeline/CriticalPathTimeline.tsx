"use client";

import { motion } from "framer-motion";
import { clsx } from "@/lib/clsx";
import {
  buildTimelineModel,
  formatNiceDate,
  monthsBetween,
  type ConflictPair,
  type TimelineNode,
} from "./timelineUtils";
import { ITC_DEADLINE_LABEL } from "@/lib/mockData";
import type { TimelineEvent } from "@/lib/types";

// Fixed internal coordinate width. The track never renders narrower than this
// so clustered nodes keep breathing room; on wider screens it fills the space
// and nodes simply spread further apart (less overlap — always safe).
const TRACK_W = 1000;
const TOP = 84; // room above the axis for conflict brackets + deadline label
const LANE_H = 52;
const BOTTOM_PAD = 12;

function pct(v: number): string {
  return `${(v * 100).toFixed(3)}%`;
}

/** One conflict bracket: a squared ⊓ connector above the axis. */
function ConflictBracket({
  pair,
  axisY,
  index,
}: {
  pair: ConflictPair;
  axisY: number;
  index: number;
}) {
  const left = Math.min(pair.earlier.pos, pair.later.pos);
  const right = Math.max(pair.earlier.pos, pair.later.pos);
  const width = right - left;
  const height = 26 + index * 6; // small stagger so multiple brackets read clearly

  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{
        left: pct(left),
        width: pct(width),
        top: axisY - height - 2,
        height,
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + index * 0.12, duration: 0.4, ease: "easeOut" }}
    >
      <div
        className="absolute inset-0 rounded-t-[8px]"
        style={{
          borderTop: "1.5px solid var(--color-risk)",
          borderLeft: "1.5px solid var(--color-risk)",
          borderRight: "1.5px solid var(--color-risk)",
        }}
      />
      <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-risk-soft px-2 py-0.5 text-xs font-medium text-risk-ink">
        {pair.weeks} wk overlap
      </span>
    </motion.div>
  );
}

function MilestoneLabel({
  node,
  axisY,
}: {
  node: TimelineNode;
  axisY: number;
}) {
  const top = axisY + 14 + node.lane * LANE_H;
  return (
    <motion.div
      className="absolute"
      style={{ left: pct(node.labelStart), width: pct(0.17), top }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 + node.pos * 0.25, duration: 0.35 }}
    >
      <div
        className={clsx(
          "mx-auto w-full rounded-[8px] px-2.5 py-1.5 text-center",
          node.conflicted ? "bg-risk-soft" : "bg-surface-2",
        )}
      >
        <p
          className={clsx(
            "text-xs font-medium leading-snug",
            node.conflicted ? "text-risk-ink" : "text-ink",
          )}
        >
          {node.event.label}
        </p>
        <p
          className={clsx(
            "mt-0.5 text-xs",
            node.conflicted ? "text-risk-ink" : "text-faint",
          )}
        >
          {formatNiceDate(node.event.date)}
        </p>
      </div>
    </motion.div>
  );
}

export function CriticalPathTimeline({ events }: { events: TimelineEvent[] }) {
  const model = buildTimelineModel(events);
  const axisY = TOP;
  const height = TOP + model.laneCount * LANE_H + BOTTOM_PAD;

  // Leader lines from each milestone dot down to its label lane.
  return (
    <div className="overflow-x-auto">
      <div
        className="relative"
        style={{ minWidth: TRACK_W, width: "100%", height }}
      >
        {/* Axis line — draws in from the left. */}
        <motion.div
          className="absolute rounded-full bg-hairline"
          style={{ left: 0, right: 0, top: axisY, height: 2, transformOrigin: "left center" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {/* Runway annotation between the last milestone and the ITC deadline. */}
        {model.deadline &&
          model.milestones.length > 0 &&
          (() => {
            const last = model.milestones[model.milestones.length - 1];
            const mid = (last.pos + model.deadline!.pos) / 2;
            const months = monthsBetween(
              last.event.date,
              model.deadline!.event.date,
            );
            return (
              <motion.div
                className="absolute -translate-x-1/2 whitespace-nowrap text-xs text-faint"
                style={{ left: pct(mid), top: axisY - 22 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
              >
                {months} months of ITC runway after COD
              </motion.div>
            );
          })()}

        {/* Conflict brackets above the axis. */}
        {model.conflicts.map((pair, i) => (
          <ConflictBracket
            key={`${pair.from.event.label}-${pair.to.event.label}`}
            pair={pair}
            axisY={axisY}
            index={i}
          />
        ))}

        {/* Milestone leader lines + dots. */}
        {model.milestones.map((node) => {
          const laneTop = axisY + 14 + node.lane * LANE_H;
          return (
            <div key={node.event.label}>
              <motion.div
                className="absolute"
                style={{
                  left: pct(node.pos),
                  top: axisY,
                  width: 1,
                  height: laneTop - axisY,
                  backgroundColor: node.conflicted
                    ? "var(--color-risk)"
                    : "var(--color-hairline)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: node.conflicted ? 0.5 : 1 }}
                transition={{ delay: 0.4 + node.pos * 0.25, duration: 0.3 }}
              />
              <motion.span
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: pct(node.pos),
                  top: axisY,
                  width: node.conflicted ? 13 : 11,
                  height: node.conflicted ? 13 : 11,
                  backgroundColor: node.conflicted
                    ? "var(--color-risk)"
                    : "white",
                  border: node.conflicted
                    ? "2px solid var(--color-risk)"
                    : "2px solid var(--color-vista)",
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.35 + node.pos * 0.25,
                  type: "spring",
                  stiffness: 400,
                  damping: 22,
                }}
              />
            </div>
          );
        })}

        {/* Milestone labels. */}
        {model.milestones.map((node) => (
          <MilestoneLabel key={node.event.label} node={node} axisY={axisY} />
        ))}

        {/* Hard ITC deadline — full-height vertical line, clearly labelled. */}
        {model.deadline && (
          <>
            <motion.div
              className="absolute"
              style={{
                left: pct(model.deadline.pos),
                top: 30,
                bottom: 0,
                width: 2,
                backgroundColor: "var(--color-ink)",
                transformOrigin: "top",
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.6, duration: 0.6, ease: "easeInOut" }}
            />
            <motion.span
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-ink"
              style={{
                left: pct(model.deadline.pos),
                top: axisY,
                width: 13,
                height: 13,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.9, type: "spring", stiffness: 400, damping: 22 }}
            />
            <motion.div
              className="absolute text-right"
              style={{
                right: `calc(${pct(1 - model.deadline.pos)} + 10px)`,
                top: 0,
                maxWidth: 220,
              }}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.4 }}
            >
              <p className="text-xs font-semibold text-ink">Hard ITC deadline</p>
              <p className="mt-0.5 text-xs text-muted">{ITC_DEADLINE_LABEL}</p>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
