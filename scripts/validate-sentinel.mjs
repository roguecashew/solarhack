/**
 * Zero-dependency structural validator: proves agent-generated JSON conforms
 * to the Solar Sentinel frontend schema (frontend/src/lib/types.ts).
 *
 * Usage:  node scripts/validate-sentinel.mjs [file.json ...]
 *         (defaults to agent_backend/sentinel-samples/*.sentinel.json)
 *
 * Exit 0 = all files conform. Exit 1 = violations (printed with paths).
 */
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAMPLES = join(ROOT, "agent_backend", "sentinel-samples");

const RISK_BANDS = new Set(["strong", "watch", "risk"]);
const PILLARS = new Set(["Land", "Law", "Finance", "Materials", "Demand"]);
const STATUS_LABELS = new Set(["Cleared", "Watch", "Flagged"]);
const PROJECT_STATUS = new Set(["on-track", "needs-review", "at-risk"]);
const EVIDENCE_KINDS = new Set(["single", "contradiction"]);
const CONFIDENCE = new Set(["High confidence", "Medium confidence", "Needs review"]);
const TIMELINE_KINDS = new Set(["milestone", "deadline"]);
const IMPACTS = new Set(["high", "medium"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const errors = [];
const isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v) => typeof v === "string";
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isBool = (v) => typeof v === "boolean";
const isStrArr = (v) => Array.isArray(v) && v.every(isStr);

function req(cond, path, msg) {
  if (!cond) errors.push(`${path}: ${msg} (got ${JSON.stringify(msg.length > 60 ? "…" : cond)})`);
}
function checkEnum(v, set, path) { if (!set.has(v)) errors.push(`${path}: invalid enum value ${JSON.stringify(v)}`); }

function checkFactor(f, path) {
  if (!isObj(f)) return errors.push(`${path}: not an object`);
  ["id", "name", "evidence"].forEach((k) => req(isStr(f[k]), `${path}.${k}`, "must be string"));
  checkEnum(f.band, RISK_BANDS, `${path}.band`);
  checkEnum(f.statusLabel, STATUS_LABELS, `${path}.statusLabel`);
  req(isStrArr(f.sources), `${path}.sources`, "must be string[]");
  if (f.evidenceId !== undefined) req(isStr(f.evidenceId), `${path}.evidenceId`, "must be string if present");
}

function checkPillar(p, path) {
  if (!isObj(p)) return errors.push(`${path}: not an object`);
  checkEnum(p.name, PILLARS, `${path}.name`);
  req(isNum(p.score), `${path}.score`, "must be number");
  checkEnum(p.band, RISK_BANDS, `${path}.band`);
  req(isBool(p.unlocked), `${path}.unlocked`, "must be boolean");
  req(isStrArr(p.subAgents), `${path}.subAgents`, "must be string[]");
  req(Array.isArray(p.factors), `${path}.factors`, "must be array");
  (p.factors || []).forEach((f, i) => checkFactor(f, `${path}.factors[${i}]`));
}

function checkEvidenceSource(s, path) {
  if (!isObj(s)) return errors.push(`${path}: not an object`);
  ["title", "location", "highlight", "extractedLabel", "extractedValue"].forEach((k) =>
    req(isStr(s[k]), `${path}.${k}`, "must be string"));
}

function checkEvidence(ev, path) {
  if (!isObj(ev)) return errors.push(`${path}: not an object`);
  ["id", "factorName", "summary"].forEach((k) => req(isStr(ev[k]), `${path}.${k}`, "must be string"));
  checkEnum(ev.kind, EVIDENCE_KINDS, `${path}.kind`);
  checkEnum(ev.confidence, CONFIDENCE, `${path}.confidence`);
  req(Array.isArray(ev.sources), `${path}.sources`, "must be array");
  (ev.sources || []).forEach((s, i) => checkEvidenceSource(s, `${path}.sources[${i}]`));
  if (ev.comparison !== undefined) {
    req(isObj(ev.comparison) && isStr(ev.comparison.dimension), `${path}.comparison.dimension`, "must be string");
    req(Array.isArray(ev.comparison?.rows), `${path}.comparison.rows`, "must be array");
    (ev.comparison?.rows || []).forEach((r, i) => {
      ["label", "a", "b"].forEach((k) => req(isStr(r[k]), `${path}.comparison.rows[${i}].${k}`, "must be string"));
    });
  }
}

function checkTimelineEvent(e, path) {
  if (!isObj(e)) return errors.push(`${path}: not an object`);
  req(isStr(e.label), `${path}.label`, "must be string");
  req(isStr(e.date) && ISO_DATE.test(e.date), `${path}.date`, "must be ISO date YYYY-MM-DD");
  if (e.conflictsWith !== undefined) req(isStr(e.conflictsWith), `${path}.conflictsWith`, "must be string if present");
  if (e.kind !== undefined) checkEnum(e.kind, TIMELINE_KINDS, `${path}.kind`);
}

function checkDocument(d, path) {
  if (!isObj(d)) return errors.push(`${path}: not an object`);
  ["id", "title", "kind", "uploadedAt"].forEach((k) => req(isStr(d[k]), `${path}.${k}`, "must be string"));
  req(isNum(d.pages), `${path}.pages`, "must be number");
  req(Array.isArray(d.pillars), `${path}.pillars`, "must be array");
  (d.pillars || []).forEach((p, i) => checkEnum(p, PILLARS, `${path}.pillars[${i}]`));
}

function checkPriorityAction(a, path) {
  if (!isObj(a)) return errors.push(`${path}: not an object`);
  ["id", "title", "detail"].forEach((k) => req(isStr(a[k]), `${path}.${k}`, "must be string"));
  req(isNum(a.rank), `${path}.rank`, "must be number");
  req(isNum(a.scoreDelta), `${path}.scoreDelta`, "must be number");
  checkEnum(a.impact, IMPACTS, `${path}.impact`);
  if (a.evidenceLink !== undefined) req(isStr(a.evidenceLink), `${path}.evidenceLink`, "must be string if present");
}

function checkChatMessage(m, path) {
  if (!isObj(m)) return errors.push(`${path}: not an object`);
  checkEnum(m.role, new Set(["user", "assistant"]), `${path}.role`);
  req(isStr(m.text), `${path}.text`, "must be string");
  (m.actions || []).forEach((a, i) => {
    req(isStr(a.name), `${path}.actions[${i}].name`, "must be string");
    checkEnum(a.impact, IMPACTS, `${path}.actions[${i}].impact`);
  });
}

export function validateProjectDetail(detail, label = "input") {
  const p = "ProjectDetail";
  if (!isObj(detail)) return errors.push(`${label}: not an object`);

  // Project
  const proj = detail.project;
  if (!isObj(proj)) errors.push(`${p}.project: missing`);
  else {
    ["id", "name", "location", "scoreReason"].forEach((k) =>
      req(isStr(proj[k]), `${p}.project.${k}`, "must be string"));
    ["capacityMW", "latitude", "longitude", "activationScore"].forEach((k) =>
      req(isNum(proj[k]), `${p}.project.${k}`, "must be number"));
    checkEnum(proj.band, RISK_BANDS, `${p}.project.band`);
    checkEnum(proj.status, PROJECT_STATUS, `${p}.project.status`);
    req(Array.isArray(proj.pillars), `${p}.project.pillars`, "must be array");
    (proj.pillars || []).forEach((pl, i) => checkPillar(pl, `${p}.project.pillars[${i}]`));
  }

  // Evidence record
  req(isObj(detail.evidence), `${p}.evidence`, "must be a record");
  Object.entries(detail.evidence || {}).forEach(([k, ev]) => checkEvidence(ev, `${p}.evidence["${k}"]`));

  // Collections
  req(Array.isArray(detail.timeline), `${p}.timeline`, "must be array");
  (detail.timeline || []).forEach((e, i) => checkTimelineEvent(e, `${p}.timeline[${i}]`));
  req(Array.isArray(detail.documents), `${p}.documents`, "must be array");
  (detail.documents || []).forEach((d, i) => checkDocument(d, `${p}.documents[${i}]`));
  req(Array.isArray(detail.priorityActions), `${p}.priorityActions`, "must be array");
  (detail.priorityActions || []).forEach((a, i) => checkPriorityAction(a, `${p}.priorityActions[${i}]`));
  req(isNum(detail.projectedScoreAfterMitigation), `${p}.projectedScoreAfterMitigation`, "must be number");
  req(Array.isArray(detail.suggestedQuestions), `${p}.suggestedQuestions`, "must be array");
  (detail.suggestedQuestions || []).forEach((q, i) => {
    req(isStr(q.question), `${p}.suggestedQuestions[${i}].question`, "must be string");
    checkChatMessage(q.answer, `${p}.suggestedQuestions[${i}].answer`);
  });
  req(Array.isArray(detail.chatHistory), `${p}.chatHistory`, "must be array");
  (detail.chatHistory || []).forEach((m, i) => checkChatMessage(m, `${p}.chatHistory[${i}]`));

  return errors.length === 0;
}

// CLI
if (process.argv[1] && process.argv[1].endsWith("validate-sentinel.mjs")) {
  const files = process.argv.slice(2).length
    ? process.argv.slice(2)
    : readdirSync(SAMPLES).filter((f) => f.endsWith(".sentinel.json")).map((f) => join(SAMPLES, f));
  let failed = 0;
  for (const f of files) {
    const before = errors.length;
    try {
      validateProjectDetail(JSON.parse(readFileSync(f, "utf-8")), f);
    } catch (e) {
      errors.push(`${f}: unreadable JSON — ${e.message}`);
    }
    const n = errors.length - before;
    console.log(`${n === 0 ? "CONFORMS" : "VIOLATES"}  ${f.split(/[\\/]/).pop()}${n ? ` (${n} violations)` : ""}`);
    if (n) failed++;
  }
  if (errors.length) { console.log("\n" + errors.join("\n")); process.exit(1); }
  console.log(`\nAll ${files.length} file(s) conform to frontend/src/lib/types.ts (ProjectDetail).`);
  if (failed) process.exit(1);
}
