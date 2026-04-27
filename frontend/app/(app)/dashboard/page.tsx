"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Topbar } from "@/components/app/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { useStore, usePriorityColor } from "@/lib/store";
import { dailyStandup } from "@/lib/ai-mock";
import { formatDate, relativeTime } from "@/lib/utils";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/types";

export default function DashboardPage() {
  const me = useStore((s) => s.currentUser());
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);

  const myTasks = useMemo(
    () => tasks.filter((t) => t.assigneeId === me?.id && t.status !== "DONE"),
    [tasks, me]
  );
  const blocked = useMemo(() => tasks.filter((t) => t.status === "BLOCKED"), [tasks]);
  const completedThisWeek = useMemo(() => {
    const week = Date.now() - 7 * 86400_000;
    return tasks.filter(
      (t) => t.status === "DONE" && new Date(t.updatedAt).getTime() > week
    ).length;
  }, [tasks]);

  const [standup, setStandup] = useState<{ summary: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    dailyStandup(tasks).then((r) => !cancelled && setStandup({ summary: r.summary }));
    return () => {
      cancelled = true;
    };
  }, [tasks]);

  const userById = (id?: string | null) => users.find((u) => u.id === id);

  return (
    <>
      <Topbar
        title={
          <span>
            Good {greeting()}, <span className="font-semibold">{me?.displayName?.split(" ")[0]}</span>
          </span>
        }
      />

      <main className="container max-w-6xl space-y-8 py-8">
        {/* Headline */}
        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h2 className="font-display mt-2 text-4xl tracking-tight md:text-5xl">
            Here's what's on your plate.
          </h2>
        </section>

        {/* AI standup card */}
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card">
          <div className="flex items-start gap-4 p-6">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-primary">
                  Daily standup
                </span>
                <Badge variant="outline">AI generated</Badge>
              </div>
              <p className="mt-2 text-pretty text-base leading-relaxed">
                {standup?.summary ?? "Generating today's summary…"}
              </p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={<Clock className="h-4 w-4" />}
            label="Open tasks (you)"
            value={myTasks.length}
          />
          <Stat
            icon={<CircleAlert className="h-4 w-4 text-destructive" />}
            label="Blocked"
            value={blocked.length}
          />
          <Stat
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            label="Shipped this week"
            value={completedThisWeek}
          />
          <Stat
            icon={<TrendingUp className="h-4 w-4" />}
            label="Active projects"
            value={projects.length}
          />
        </section>

        {/* My tasks + blockers */}
        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your open tasks</CardTitle>
              <Badge variant="default">{myTasks.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-1">
              {myTasks.length === 0 ? (
                <Empty message="Nothing's on your plate. Nice." />
              ) : (
                myTasks.map((t) => {
                  const project = projects.find((p) => p.id === t.projectId);
                  return (
                    <Link
                      key={t.id}
                      href={`/projects/${t.projectId}#${t.id}`}
                      className="-mx-3 flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-secondary/60"
                    >
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${usePriorityColor(t.priority)}`}>
                        {t.priority}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{t.title}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {project?.emoji} {project?.name} · {STATUS_LABEL[t.status]}
                          {t.dueDate ? ` · due ${formatDate(t.dueDate)}` : ""}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Blockers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {blocked.length === 0 ? (
                <Empty message="Nothing blocked. Keep moving." />
              ) : (
                blocked.map((t) => {
                  const project = projects.find((p) => p.id === t.projectId);
                  const u = userById(t.assigneeId);
                  return (
                    <Link
                      key={t.id}
                      href={`/projects/${t.projectId}#${t.id}`}
                      className="block rounded-md border border-destructive/20 bg-destructive/5 p-3 transition-colors hover:bg-destructive/10"
                    >
                      <div className="text-sm font-medium">{t.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {project?.name}
                      </div>
                      {u ? (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <UserAvatar name={u.displayName} size="sm" />
                          <span>{u.displayName}</span>
                        </div>
                      ) : null}
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>

        {/* Projects grid */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="text-lg font-semibold">Projects</h3>
              <p className="text-sm text-muted-foreground">
                Recent work across your workspace.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/ai">
                Ask co-pilot <Sparkles className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const projectTasks = tasks.filter((t) => t.projectId === p.id);
              const open = projectTasks.filter((t) => t.status !== "DONE").length;
              const done = projectTasks.filter((t) => t.status === "DONE").length;
              const total = open + done || 1;
              const pct = Math.round((done / total) * 100);
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="group rounded-lg border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-elevated"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-2xl leading-none">{p.emoji}</div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {projectTasks.length} tasks
                    </span>
                  </div>
                  <div className="mt-4 font-semibold">{p.name}</div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{pct}% complete</span>
                      <span>{relativeTime(p.createdAt)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <div className="mt-2 font-display text-3xl tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="grid place-items-center rounded-md border border-dashed border-border py-10 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
