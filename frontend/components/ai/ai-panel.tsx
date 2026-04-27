"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  ListChecks,
  Loader2,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useStore, usePriorityColor } from "@/lib/store";
import {
  parseTask,
  prioritiseBacklog,
  suggestTasks,
  type ParsedTask,
  type TaskSuggestion,
} from "@/lib/ai-mock";
import { cn, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { Task, TaskPriority } from "@/lib/types";

type Tab = "suggest" | "prioritise" | "parse";

export function AiPanel({ projectId }: { projectId?: string }) {
  const [tab, setTab] = useState<Tab>("suggest");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div>
          <div className="text-sm font-semibold">Co-pilot</div>
          <div className="text-[11px] text-muted-foreground">
            GPT-4o-mini · structured outputs
          </div>
        </div>
      </div>

      <div className="flex border-b border-border">
        <TabButton active={tab === "suggest"} onClick={() => setTab("suggest")}>
          Suggest
        </TabButton>
        <TabButton active={tab === "prioritise"} onClick={() => setTab("prioritise")}>
          Prioritise
        </TabButton>
        <TabButton active={tab === "parse"} onClick={() => setTab("parse")}>
          Parse
        </TabButton>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {tab === "suggest" && <SuggestPane projectId={projectId} />}
        {tab === "prioritise" && <PrioritisePane projectId={projectId} />}
        {tab === "parse" && <ParsePane projectId={projectId} />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 px-4 py-2.5 text-xs font-medium transition-colors",
        active
          ? "border-b-2 border-primary text-foreground"
          : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

// SUGGEST -------------------------------------------------------------------
function SuggestPane({ projectId }: { projectId?: string }) {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const create = useStore((s) => s.createTask);
  const project = projects.find((p) => p.id === projectId);
  const { toast } = useToast();

  const [items, setItems] = useState<TaskSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());

  async function generate() {
    if (!project) return;
    setLoading(true);
    setAccepted(new Set());
    const projectTasks = tasks.filter((t) => t.projectId === project.id).slice(-30);
    const result = await suggestTasks(project.name, projectTasks);
    setItems(result);
    setLoading(false);
  }

  function accept(idx: number, s: TaskSuggestion) {
    if (!project) return;
    create({
      title: s.title,
      description: s.description,
      priority: s.suggestedPriority,
      projectId: project.id,
      status: "TODO",
    });
    setAccepted((prev) => new Set(prev).add(idx));
    toast({ title: "Task added", description: s.title, variant: "success" });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card p-4">
        <p className="text-sm">
          Read the last 30 tasks in <span className="font-medium">{project?.name ?? "this project"}</span> and propose 5 concrete next moves.
        </p>
        <Button
          className="mt-3 w-full"
          onClick={generate}
          disabled={loading || !project}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" /> Suggest 5 tasks
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((s, i) => (
          <div
            key={i}
            className={cn(
              "rounded-md border border-border bg-card p-3 transition-opacity",
              accepted.has(i) && "opacity-50"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                  usePriorityColor(s.suggestedPriority)
                )}
              >
                {s.suggestedPriority}
              </span>
              {accepted.has(i) ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                  <Check className="h-3 w-3" /> Added
                </span>
              ) : null}
            </div>
            <h4 className="mt-2 text-sm font-medium leading-snug">{s.title}</h4>
            <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
            {!accepted.has(i) ? (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => accept(i, s)}>
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setItems((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  Dismiss
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// PRIORITISE ----------------------------------------------------------------
function PrioritisePane({ projectId }: { projectId?: string }) {
  const tasks = useStore((s) => s.tasks);
  const update = useStore((s) => s.updateTask);
  const { toast } = useToast();

  const todo = tasks.filter(
    (t) => (!projectId || t.projectId === projectId) && t.status !== "DONE"
  );

  const [proposal, setProposal] = useState<
    { taskId: string; currentPriority: TaskPriority; proposedPriority: TaskPriority }[] | null
  >(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setProposal(await prioritiseBacklog(todo));
    setLoading(false);
  }

  function applyAll() {
    if (!proposal) return;
    for (const p of proposal) {
      if (p.currentPriority !== p.proposedPriority) {
        update(p.taskId, { priority: p.proposedPriority });
      }
    }
    toast({ title: "Backlog reprioritised", variant: "success" });
    setProposal(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card p-4">
        <p className="text-sm">
          Re-rank {todo.length} open task{todo.length === 1 ? "" : "s"} by due date,
          status and dependencies. You confirm before anything changes.
        </p>
        <Button className="mt-3 w-full" onClick={generate} disabled={loading || !todo.length}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Re-ranking…
            </>
          ) : (
            <>
              <ListChecks className="h-4 w-4" /> Propose new priorities
            </>
          )}
        </Button>
      </div>

      {proposal ? (
        <>
          <div className="rounded-md border border-border bg-card">
            {proposal.map((p) => {
              const t = tasks.find((x) => x.id === p.taskId);
              if (!t) return null;
              const changed = p.currentPriority !== p.proposedPriority;
              return (
                <div
                  key={p.taskId}
                  className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0"
                >
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                      usePriorityColor(p.currentPriority)
                    )}
                  >
                    {p.currentPriority}
                  </span>
                  <ArrowUpRight
                    className={cn(
                      "h-3 w-3",
                      changed ? "text-primary" : "text-muted-foreground/50"
                    )}
                  />
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                      usePriorityColor(p.proposedPriority),
                      changed && "ring-1 ring-primary/40"
                    )}
                  >
                    {p.proposedPriority}
                  </span>
                  <span className="ml-1 flex-1 truncate text-sm">{t.title}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button onClick={applyAll}>Apply all</Button>
            <Button variant="ghost" onClick={() => setProposal(null)}>
              Discard
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

// PARSE ---------------------------------------------------------------------
function ParsePane({ projectId }: { projectId?: string }) {
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const create = useStore((s) => s.createTask);
  const { toast } = useToast();

  const [sentence, setSentence] = useState(
    "Schedule a 30-min review with Marco on Friday — high priority"
  );
  const [parsed, setParsed] = useState<ParsedTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [chosenProject, setChosenProject] = useState<string>(projectId ?? projects[0]?.id);

  async function go() {
    setLoading(true);
    setParsed(await parseTask(sentence));
    setLoading(false);
  }

  function add() {
    if (!parsed) return;
    const assignee = users.find((u) =>
      parsed.assigneeHint
        ? u.displayName.toLowerCase().includes(parsed.assigneeHint.toLowerCase())
        : false
    );
    create({
      title: parsed.title,
      projectId: chosenProject,
      priority: parsed.priority ?? "P2",
      dueDate: parsed.dueDate,
      assigneeId: assignee?.id ?? null,
    });
    toast({ title: "Task created", description: parsed.title, variant: "success" });
    setParsed(null);
    setSentence("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card p-4">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">
          What needs doing?
        </label>
        <Textarea
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          className="mt-2 min-h-[80px]"
        />
        <Button className="mt-3 w-full" onClick={go} disabled={!sentence.trim() || loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Parsing…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" /> Parse to task
            </>
          )}
        </Button>
      </div>

      {parsed ? (
        <div className="rounded-md border border-border bg-card p-4">
          <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
            Parsed
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <KV k="Title" v={parsed.title} />
            <KV k="Assignee" v={parsed.assigneeHint ?? "—"} />
            <KV k="Due" v={parsed.dueDate ? formatDate(parsed.dueDate) : "—"} />
            <KV k="Duration" v={parsed.durationMinutes ? `${parsed.durationMinutes} min` : "—"} />
            <KV k="Priority" v={parsed.priority ?? "—"} />
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={add}>Add to project</Button>
            <Button variant="ghost" onClick={() => setParsed(null)}>
              <X className="h-3.5 w-3.5" /> Discard
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="mt-0.5 font-medium">{v}</div>
    </div>
  );
}
