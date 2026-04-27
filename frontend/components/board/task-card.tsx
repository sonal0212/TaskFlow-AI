"use client";

import { useMemo } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { CalendarDays, MessageSquare } from "lucide-react";
import { Task } from "@/lib/types";
import { useStore, usePriorityColor } from "@/lib/store";
import { UserAvatar } from "@/components/ui/avatar";
import { cn, formatDate } from "@/lib/utils";

export function TaskCard({
  task,
  onOpen,
  isDragging = false,
}: {
  task: Task;
  onOpen?: (id: string) => void;
  isDragging?: boolean;
}) {
  const users = useStore((s) => s.users);
  const labels = useStore((s) => s.labels);
  const allComments = useStore((s) => s.comments);
  const comments = useMemo(
    () => allComments.filter((c) => c.taskId === task.id),
    [allComments, task.id]
  );
  const assignee = users.find((u) => u.id === task.assigneeId);
  const taskLabels = useMemo(
    () => labels.filter((l) => task.labelIds.includes(l.id)),
    [labels, task.labelIds]
  );

  const overdue = task.dueDate
    ? new Date(task.dueDate).getTime() < Date.now() - 86400_000 && task.status !== "DONE"
    : false;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(task.id)}
      className={cn(
        "group cursor-grab rounded-md border border-border bg-card p-3 text-left shadow-soft transition-all",
        "hover:shadow-elevated hover:-translate-y-px",
        (isDragging || sortableDragging) && "opacity-40",
        task.status === "DONE" && "opacity-70"
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "rounded border px-1.5 py-0.5 text-[10px] font-medium",
            usePriorityColor(task.priority)
          )}
        >
          {task.priority}
        </span>
        {taskLabels.map((l) => (
          <span
            key={l.id}
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: `${l.color}20`,
              color: l.color,
            }}
          >
            {l.name}
          </span>
        ))}
      </div>

      <h4
        className={cn(
          "mt-2 text-sm font-medium leading-snug",
          task.status === "DONE" && "line-through text-muted-foreground"
        )}
      >
        {task.title}
      </h4>

      {task.description ? (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {task.description}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {task.dueDate ? (
            <span className={cn("inline-flex items-center gap-1", overdue && "text-destructive")}>
              <CalendarDays className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          ) : null}
          {comments.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {comments.length}
            </span>
          ) : null}
        </div>
        {assignee ? <UserAvatar name={assignee.displayName} size="sm" /> : null}
      </div>
    </article>
  );
}
