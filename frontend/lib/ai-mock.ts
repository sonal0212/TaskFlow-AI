// Client-side simulation of the AI endpoints described in BRD §FR-5.
// The backend will provide the real implementation via Spring AI; the mock
// produces deterministic, plausible output for demos and offline development.

import type { Task, TaskPriority } from "./types";

export interface TaskSuggestion {
  title: string;
  description: string;
  suggestedPriority: TaskPriority;
}

export interface ParsedTask {
  title: string;
  assigneeHint: string | null;
  dueDate: string | null;
  durationMinutes: number | null;
  priority: TaskPriority | null;
}

// FR-5.1 suggest tasks ------------------------------------------------------
export async function suggestTasks(
  projectName: string,
  recent: Task[]
): Promise<TaskSuggestion[]> {
  await delay(900);
  const has = (kw: string) =>
    recent.some((t) => t.title.toLowerCase().includes(kw));

  const candidates: TaskSuggestion[] = [
    {
      title: "Add launch-day status page",
      description:
        "Spin up a public status endpoint with a per-component health badge so support has a single link to share if anything wobbles.",
      suggestedPriority: "P1",
    },
    {
      title: "Write 'first 5 minutes' onboarding email",
      description:
        "Cover account verification, the first project, and inviting one teammate. Aim for ≤120 words.",
      suggestedPriority: "P2",
    },
    {
      title: "Profile slow Postgres queries on /tasks",
      description:
        "EXPLAIN ANALYZE the top 10 read queries and confirm the partial index on (project_id, status) is hit.",
      suggestedPriority: has("query") ? "P2" : "P1",
    },
    {
      title: "Run accessibility audit on board view",
      description:
        "Check keyboard reorder, focus rings on cards, and screen-reader status announcements during drag.",
      suggestedPriority: "P2",
    },
    {
      title: "Draft incident-response runbook",
      description:
        "Define on-call rotation, severity levels, and the comms template for status-page updates.",
      suggestedPriority: "P3",
    },
    {
      title: `Plan retro for ${projectName}`,
      description:
        "Schedule a 45-min retro within a week of launch. Use start/stop/continue framing and capture actions in this project.",
      suggestedPriority: "P3",
    },
  ];

  // Pick 5, biased by what's missing
  return candidates.slice(0, 5);
}

// FR-5.2 prioritise backlog -------------------------------------------------
export async function prioritiseBacklog(tasks: Task[]) {
  await delay(1100);
  // Heuristic: due date proximity + status (BLOCKED first if close)
  const score = (t: Task) => {
    const due = t.dueDate ? new Date(t.dueDate).getTime() : Infinity;
    const proximity = (due - Date.now()) / 86400_000;
    let s = -proximity;
    if (t.status === "BLOCKED") s += 5;
    if (t.priority === "P0") s += 4;
    if (t.priority === "P1") s += 2;
    return s;
  };
  const ranked = [...tasks].sort((a, b) => score(b) - score(a));
  return ranked.map((t, i) => ({
    taskId: t.id,
    currentPriority: t.priority,
    proposedPriority: nextPriority(i),
  }));
}

function nextPriority(rank: number): TaskPriority {
  if (rank === 0) return "P0";
  if (rank <= 2) return "P1";
  if (rank <= 5) return "P2";
  return "P3";
}

// FR-5.3 parse natural-language task ----------------------------------------
export async function parseTask(sentence: string): Promise<ParsedTask> {
  await delay(700);
  const lower = sentence.toLowerCase();
  const dueDate = pickDate(lower);
  const duration = pickDuration(lower);
  const priority = pickPriority(lower);
  const assigneeHint = pickAssignee(sentence);
  const title = cleanTitle(sentence);
  return { title, assigneeHint, dueDate, durationMinutes: duration, priority };
}

function pickDate(s: string): string | null {
  const today = new Date();
  const map: Record<string, number> = {
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0,
  };
  for (const [name, weekday] of Object.entries(map)) {
    if (s.includes(name)) {
      const d = new Date(today);
      const diff = (weekday + 7 - today.getDay()) % 7 || 7;
      d.setDate(today.getDate() + diff);
      return d.toISOString().slice(0, 10);
    }
  }
  if (s.includes("tomorrow")) {
    const d = new Date(today); d.setDate(today.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  if (s.includes("today")) return today.toISOString().slice(0, 10);
  if (s.includes("next week")) {
    const d = new Date(today); d.setDate(today.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }
  return null;
}

function pickDuration(s: string): number | null {
  const m = s.match(/(\d+)\s*(min|minute|minutes|hour|hours|hr|hrs)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return /hour|hr/.test(m[2]) ? n * 60 : n;
}

function pickPriority(s: string): TaskPriority | null {
  if (/urgent|asap|critical|blocker/.test(s)) return "P0";
  if (/high priority|important/.test(s)) return "P1";
  if (/low priority|whenever|nice to have/.test(s)) return "P3";
  return null;
}

function pickAssignee(s: string): string | null {
  const m = s.match(/with\s+([A-Z][a-z]+)/) || s.match(/@([A-Za-z]+)/);
  return m ? m[1] : null;
}

function cleanTitle(s: string): string {
  // Strip leading verbs of administrative noise
  const t = s
    .replace(/^(can you |please |i need to |let's |let me )/i, "")
    .replace(/\s+(by|on|next|tomorrow|today)\s+.*$/i, "")
    .trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// FR-5.4 daily standup summary ---------------------------------------------
export async function dailyStandup(tasks: Task[], today = new Date()) {
  await delay(600);
  const yesterday = new Date(today.getTime() - 86400_000);
  const isYesterday = (iso: string) =>
    new Date(iso).toDateString() === yesterday.toDateString();

  const completed = tasks.filter((t) => t.status === "DONE" && isYesterday(t.updatedAt));
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS");
  const blocked = tasks.filter((t) => t.status === "BLOCKED");

  return {
    completedYesterday: completed.length,
    inProgress: inProgress.length,
    blocked,
    summary:
      blocked.length > 0
        ? `${blocked.length} task${blocked.length === 1 ? "" : "s"} ${blocked.length === 1 ? "is" : "are"} blocked. ${inProgress.length} in flight, ${completed.length} shipped yesterday.`
        : `On track. ${inProgress.length} in flight, ${completed.length} shipped yesterday.`,
  };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
