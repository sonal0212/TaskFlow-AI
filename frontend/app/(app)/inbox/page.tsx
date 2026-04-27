"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AtSign, CheckCheck, MessageSquare, Sparkles, UserPlus } from "lucide-react";
import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { relativeTime, cn } from "@/lib/utils";
import type { Notification, NotificationType } from "@/lib/types";

const ICON: Record<NotificationType, React.ReactNode> = {
  ASSIGNED: <UserPlus className="h-4 w-4" />,
  MENTIONED: <AtSign className="h-4 w-4" />,
  COMMENTED: <MessageSquare className="h-4 w-4" />,
  STATUS_BLOCKED: <Sparkles className="h-4 w-4" />,
  AI_SUGGESTION: <Sparkles className="h-4 w-4" />,
};

export default function InboxPage() {
  const me = useStore((s) => s.currentUser());
  // IMPORTANT: select raw collections, then derive — selectors that return
  // .filter() output produce a new array each call and trigger an infinite
  // re-render via React's useSyncExternalStore snapshot check.
  const notifications = useStore((s) => s.notifications);
  const projects = useStore((s) => s.projects);
  const markAll = useStore((s) => s.markAllNotificationsRead);
  const markOne = useStore((s) => s.markNotificationRead);

  const all = useMemo(
    () => notifications.filter((n) => n.userId === me?.id),
    [notifications, me?.id]
  );
  const unread = useMemo(() => all.filter((n) => !n.readAt), [all]);
  const read = useMemo(() => all.filter((n) => n.readAt), [all]);

  const renderItem = (n: Notification) => {
    const linkHref = n.payload.taskId
      ? `/projects/${n.payload.projectId ?? findProjectByTask(projects, n.payload.taskId)}#${n.payload.taskId}`
      : n.payload.projectId
      ? `/projects/${n.payload.projectId}`
      : "#";
    return (
      <Link
        key={n.id}
        href={linkHref}
        onClick={() => markOne(n.id)}
        className={cn(
          "flex items-start gap-3 rounded-md border border-border bg-card p-4 transition-colors hover:bg-secondary/40",
          !n.readAt && "border-primary/40 bg-primary/[0.06]"
        )}
      >
        <div
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-md",
            !n.readAt
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {ICON[n.type]}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm", !n.readAt && "font-medium")}>{n.payload.message}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {relativeTime(n.createdAt)}
          </p>
        </div>
        {!n.readAt ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" /> : null}
      </Link>
    );
  };

  return (
    <>
      <Topbar title="Inbox" />
      <main className="container max-w-3xl space-y-6 py-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              Activity
            </p>
            <h2 className="font-display mt-2 text-4xl tracking-tight">Inbox</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mentions, assignments and AI nudges across your workspace.
            </p>
          </div>
          {unread.length > 0 ? (
            <Button variant="outline" size="sm" onClick={markAll}>
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          ) : null}
        </div>

        {unread.length > 0 ? (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Unread
              </h3>
              <Badge variant="primary">{unread.length}</Badge>
            </div>
            {unread.map(renderItem)}
          </section>
        ) : null}

        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Earlier
          </h3>
          {read.length === 0 ? (
            <div className="rounded-md border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              You're all caught up.
            </div>
          ) : (
            read.map(renderItem)
          )}
        </section>
      </main>
    </>
  );
}

function findProjectByTask(projects: { id: string }[], _taskId: string) {
  return projects[0]?.id ?? "";
}
