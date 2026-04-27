"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, X } from "lucide-react";
import { useStore, usePriorityColor } from "@/lib/store";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { PRIORITY_LABEL, STATUS_LABEL, STATUS_ORDER } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { cn, formatDate, relativeTime } from "@/lib/utils";

export function TaskDrawer({
  taskId,
  onClose,
}: {
  taskId: string | null;
  onClose: () => void;
}) {
  const tasks = useStore((s) => s.tasks);
  const task = useMemo(
    () => (taskId ? tasks.find((t) => t.id === taskId) : undefined),
    [tasks, taskId]
  );
  const users = useStore((s) => s.users);
  const allComments = useStore((s) => s.comments);
  const comments = useMemo(
    () =>
      allComments
        .filter((c) => c.taskId === taskId)
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [allComments, taskId]
  );
  const update = useStore((s) => s.updateTask);
  const remove = useStore((s) => s.deleteTask);
  const addComment = useStore((s) => s.addComment);
  const me = useStore((s) => s.currentUser());
  const { toast } = useToast();

  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
    }
  }, [task?.id, task?.title, task?.description]);

  if (!task) return null;

  const userById = (id?: string | null) => users.find((u) => u.id === id);
  const assignee = userById(task.assigneeId);

  return (
    <div className="fixed inset-0 z-40 flex animate-fade-in" role="dialog">
      {/* Overlay */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="flex-1 bg-foreground/30 backdrop-blur-sm"
      />
      {/* Drawer */}
      <aside className="flex w-full max-w-lg animate-slide-up flex-col border-l border-border bg-card shadow-elevated">
        <header className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                usePriorityColor(task.priority)
              )}
            >
              {task.priority}
            </span>
            <span className="text-xs text-muted-foreground">{STATUS_LABEL[task.status]}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">v{task.version}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-6 scrollbar-thin">
          {/* Title */}
          <div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title.trim() && title !== task.title) {
                  update(task.id, { title });
                }
              }}
              className="w-full bg-transparent text-2xl font-display tracking-tight outline-none focus:bg-muted/40 focus:rounded-md focus:px-2 focus:-mx-2"
            />
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border py-4">
            <Field label="Status">
              <Select
                value={task.status}
                onValueChange={(v: TaskStatus) => update(task.id, { status: v })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Priority">
              <Select
                value={task.priority}
                onValueChange={(v: TaskPriority) => update(task.id, { priority: v })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["P0", "P1", "P2", "P3"] as TaskPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {p} · {PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Assignee">
              <Select
                value={task.assigneeId ?? "_unassigned"}
                onValueChange={(v) =>
                  update(task.id, { assigneeId: v === "_unassigned" ? null : v })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_unassigned">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Due date">
              <Input
                type="date"
                className="h-8"
                value={task.dueDate ?? ""}
                onChange={(e) => update(task.id, { dueDate: e.target.value || null })}
              />
            </Field>
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== task.description) {
                  update(task.id, { description });
                }
              }}
              placeholder="Add more detail…"
              className="mt-2 min-h-[120px]"
            />
          </div>

          {/* Comments */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Activity
            </Label>
            <div className="mt-3 space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : (
                comments.map((c) => {
                  const u = userById(c.authorId);
                  return (
                    <div key={c.id} className="flex gap-3">
                      <UserAvatar name={u?.displayName ?? "?"} size="sm" />
                      <div className="min-w-0 flex-1 rounded-md border border-border bg-background/60 p-3">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium">{u?.displayName ?? "Unknown"}</span>
                          <span className="text-muted-foreground">
                            {relativeTime(c.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{c.body}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 flex items-start gap-3">
              <UserAvatar name={me?.displayName ?? "?"} size="sm" />
              <div className="flex-1">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a comment… use @ to mention."
                  className="min-h-[60px]"
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    disabled={!draft.trim()}
                    onClick={() => {
                      addComment(task.id, draft.trim());
                      setDraft("");
                      toast({ title: "Comment added", variant: "success" });
                    }}
                  >
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-border p-4 text-xs text-muted-foreground">
          <span>
            Created {formatDate(task.createdAt)}
            {assignee ? ` · assigned to ${assignee.displayName}` : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Delete this task?")) {
                remove(task.id);
                toast({ title: "Task deleted" });
                onClose();
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </footer>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
