const SEVERITY = ["high", "medium", "low", "minor"];
const KINDS = ["design", "structure", "bug", "minor"];
const RULE = /^(?:D(?:10|[1-9])|S)(?:\s*,\s*(?:D(?:10|[1-9])|S))*$/;
const STATUS = /^(todo|in-progress|skipped.*|done.*)$/;
const EFFORT_COST = { S: 1, M: 2, L: 3 };
const SEVERITY_WEIGHT = { high: 3, medium: 2, low: 1, minor: 0 };
const BLAST_WEIGHT = { low: 0, medium: 1, high: 2 };

const isOpen = (f) => f.status === "todo" || f.status === "in-progress";

export function parse(text) {
  const lines = text.split("\n");
  const findings = [];
  const problems = [];
  let header = "";
  let current = null;

  for (const [index, line] of lines.entries()) {
    const heading = line.match(/^##\s+(A\d+)\s+·\s+(.+)$/);
    if (heading) {
      current = { id: heading[1], line: index + 1, fields: {}, raw: [] };
      const tokens = heading[2].split("·").map((t) => t.trim());
      const status = tokens.pop();
      current.status = status;
      current.severity = tokens.shift();
      for (const token of tokens) {
        if (KINDS.includes(token)) current.kind = token;
        else if (RULE.test(token)) current.rules = token.split(/\s*,\s*/);
        else problems.push(`${current.id}: unrecognised heading part "${token}"`);
      }
      current.kind ??= current.severity === "minor" ? "minor" : undefined;
      findings.push(current);
      continue;
    }
    if (/^#\s/.test(line) && !header) header = line;
    if (/^##\s/.test(line)) {
      current = null;
      continue;
    }
    if (!current) continue;
    current.raw.push(line);
    const whole = line.match(/^(Files|Problem|Fix):\s*(.*)$/);
    if (whole) current.fields[whole[1]] = whole[2].trim();
    else {
      for (const part of line.split(/\s+·\s+/)) {
        const pair = part.match(/^(Effort|Blast|Tests|Depends on|Batch):\s*(.*)$/);
        if (pair) current.fields[pair[1]] = pair[2].trim();
      }
    }
  }

  for (const finding of findings) normalise(finding);
  return { header, findings, problems };
}

function normalise(finding) {
  const { fields } = finding;

  finding.effort = (fields.Effort ?? "").trim().match(/^[SML]/)?.[0];
  finding.blast = (fields.Blast ?? "").trim().toLowerCase().match(/^(low|medium|high)/)?.[1];
  finding.tests = (fields.Tests ?? "").trim().toLowerCase().match(/^(yes|partial|none)/)?.[1];
  finding.batch = (fields.Batch ?? "").trim() || undefined;
  finding.depends = parseDepends(fields["Depends on"]);
}

function parseDepends(value) {
  if (!value || /^none\b/i.test(value.trim())) return [];
  const out = [];
  const pattern = /(A\d+)(?:\s*\(\s*(hard|soft)\s*(?::\s*([^)]*))?\))?/g;
  for (const match of value.matchAll(pattern)) {
    out.push({ id: match[1], type: match[2] ?? "hard", explicit: Boolean(match[2]), reason: match[3]?.trim() });
  }
  return out;
}

export function validate({ findings, problems: parseProblems }) {
  const problems = [...parseProblems];
  const ids = new Set();
  for (const f of findings) {
    const where = f.id;
    if (ids.has(f.id)) problems.push(`${where}: duplicate ID`);
    ids.add(f.id);
    if (!SEVERITY.includes(f.severity)) problems.push(`${where}: severity must be one of ${SEVERITY.join(", ")}`);
    if (!f.kind) problems.push(`${where}: missing kind (${KINDS.join(", ")})`);
    if (f.kind === "minor" && f.severity !== "minor") problems.push(`${where}: kind minor needs severity minor`);
    if (f.severity === "minor" && f.kind && f.kind !== "minor") problems.push(`${where}: severity minor needs kind minor`);
    if ((f.kind === "design" || f.kind === "minor") && !f.rules?.length) problems.push(`${where}: ${f.kind} findings need rule IDs (D1–D10)`);
    if (f.kind === "structure" && !f.rules?.includes("S")) problems.push(`${where}: structure findings use rule ID S`);
    if (!STATUS.test(f.status)) problems.push(`${where}: status must be todo, in-progress, done (<sha>) or skipped`);
    for (const key of ["Files", "Problem", "Fix"]) if (!f.fields[key]) problems.push(`${where}: missing ${key}`);
    if (f.fields.Files && !/[\w)\]]\.\w+|\//.test(f.fields.Files)) problems.push(`${where}: Files has no file path`);
    if (!f.effort) problems.push(`${where}: Effort must be S, M or L`);
    if (f.kind !== "minor") {
      if (!f.blast) problems.push(`${where}: Blast must be low, medium or high`);
      if (!f.tests) problems.push(`${where}: Tests must be yes, partial or none`);
      if (!f.batch) problems.push(`${where}: missing Batch`);
    }
    for (const dep of f.depends) {
      if (dep.id === f.id) problems.push(`${where}: depends on itself`);
      else if (!findings.some((o) => o.id === dep.id)) problems.push(`${where}: depends on unknown ${dep.id}`);
      if (dep.explicit && !dep.reason) problems.push(`${where}: ${dep.type} dependency on ${dep.id} needs a reason`);
    }
    if (f.severity === "high" && f.kind === "minor") problems.push(`${where}: a minor finding cannot be high severity`);
  }

  for (const cycle of findCycles(findings)) problems.push(`dependency cycle: ${cycle.join(" → ")}`);
  return problems;
}

function findCycles(findings) {
  const graph = new Map(findings.map((f) => [f.id, f.depends.filter((d) => d.type === "hard").map((d) => d.id)]));
  const cycles = [];
  const state = new Map();
  const stack = [];
  const visit = (id) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) {
      cycles.push([...stack.slice(stack.indexOf(id)), id]);
      return;
    }
    state.set(id, 1);
    stack.push(id);
    for (const next of graph.get(id) ?? []) if (graph.has(next)) visit(next);
    stack.pop();
    state.set(id, 2);
  };
  for (const id of graph.keys()) visit(id);
  return cycles;
}

const priority = (f) =>
  SEVERITY_WEIGHT[f.severity] * 10 + (BLAST_WEIGHT[f.blast] ?? 0) * 2 - (EFFORT_COST[f.effort] ?? 2) + (f.kind === "bug" ? 5 : 0);

export function roadmap({ findings }) {
  const byId = new Map(findings.map((f) => [f.id, f]));
  const open = findings.filter(isOpen);
  const openIds = new Set(open.map((f) => f.id));
  const hardOpen = (f) => f.depends.filter((d) => d.type === "hard" && openIds.has(d.id));
  const softOpen = (f) => f.depends.filter((d) => d.type === "soft" && openIds.has(d.id));

  const main = open.filter((f) => f.kind !== "minor");
  const minor = open.filter((f) => f.kind === "minor");

  const batches = new Map();
  for (const f of main) {
    const name = f.batch ?? `(no batch) ${f.id}`;
    if (!batches.has(name)) batches.set(name, []);
    batches.get(name).push(f);
  }
  const batchNeeds = (name) => {
    const members = new Set(batches.get(name).map((f) => f.id));
    const needs = new Set();
    for (const f of batches.get(name)) {
      for (const dep of hardOpen(f)) {
        if (members.has(dep.id)) continue;
        const target = byId.get(dep.id);
        if (target && target.kind !== "minor") needs.add(target.batch ?? `(no batch) ${dep.id}`);
      }
    }
    return needs;
  };
  const batchScore = (name) => Math.max(...batches.get(name).map(priority));

  const ordered = [];
  const remaining = new Set(batches.keys());
  while (remaining.size) {
    const ready = [...remaining].filter((name) => [...batchNeeds(name)].every((n) => !remaining.has(n) || n === name));
    const pool = ready.length ? ready : [...remaining];
    pool.sort((a, b) => batchScore(b) - batchScore(a));
    const pick = pool[0];
    ordered.push({ name: pick, blockedByCycle: !ready.length });
    remaining.delete(pick);
  }

  const sequence = ordered.map(({ name, blockedByCycle }) => {
    const members = batches.get(name).sort((a, b) => hardOpen(a).length - hardOpen(b).length || priority(b) - priority(a));
    const needs = [...batchNeeds(name)];
    const unblocks = main.filter((f) => !batches.get(name).includes(f) && f.depends.some((d) => batches.get(name).some((m) => m.id === d.id) && d.type === "hard")).map((f) => f.batch ?? f.id);
    return { name, members, needs, unblocks: [...new Set(unblocks)], blockedByCycle };
  });

  const first = sequence[0];
  const startFinding = first?.members.find((f) => hardOpen(f).length === 0) ?? first?.members[0];
  return { sequence, minor, startFinding, hardOpen, softOpen, counts: countBy(open) };
}

function countBy(open) {
  const counts = {};
  for (const f of open) counts[f.severity] = (counts[f.severity] ?? 0) + 1;
  return counts;
}

const effortTotal = (members) => {
  const total = members.reduce((sum, f) => sum + (EFFORT_COST[f.effort] ?? 2), 0);
  return total <= 2 ? "S" : total <= 4 ? "M" : "L";
};

export function render(result) {
  const { sequence, minor, startFinding, hardOpen, softOpen } = result;
  if (!sequence.length && !minor.length) return "No open findings.\n";
  const out = [];
  if (startFinding) {
    const batch = sequence[0];
    const unlocks = batch.unblocks.length ? `, unblocks ${batch.unblocks.join(", ")}` : "";
    out.push(`Start here: ${startFinding.id} (batch "${batch.name}")${unlocks}`);
  }
  out.push("");
  sequence.forEach((batch, index) => {
    const severities = batch.members.map((f) => f.severity);
    const top = SEVERITY.find((s) => severities.includes(s));
    const needs = batch.needs.length ? ` · after: ${batch.needs.join(", ")}` : "";
    out.push(`${index + 1}. ${batch.name} · ${batch.members.map((f) => f.id).join(", ")} · ${top} · effort ${effortTotal(batch.members)}${needs}${batch.blockedByCycle ? " · CYCLE between batches, split one" : ""}`);
    for (const f of batch.members) {
      const hard = hardOpen(f).map((d) => `${d.id}${d.reason ? ` (${d.reason})` : ""}`);
      const soft = softOpen(f).map((d) => `${d.id}${d.reason ? ` (${d.reason})` : ""}`);
      const meta = [`${f.severity}`, `${f.kind}`, `effort ${f.effort ?? "?"}`, `blast ${f.blast ?? "?"}`, `tests ${f.tests ?? "?"}`];
      out.push(`   ${f.id} · ${meta.join(" · ")}${hard.length ? ` · needs ${hard.join(", ")}` : ""}${soft.length ? ` · better after ${soft.join(", ")}` : ""}`);
    }
  });
  if (minor.length) out.push("", `Minor (not batched): ${minor.map((f) => f.id).join(", ")}`);
  return `${out.join("\n")}\n`;
}

export function check(text) {
  const parsed = parse(text);
  const problems = validate(parsed);
  return { parsed, problems };
}
