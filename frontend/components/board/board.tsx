"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { STATUS_LABEL, STATUS_ORDER, type Task, type TaskStatus } from "@/lib/types";
import { TaskCard } from "./task-card";
import { TaskDrawer } from "./task-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Board({ projectId }: { projectId: string }) {
  const allTasks = useStore((s) => s.tasks);
  const moveTask = useStore((s) => s.moveTask);
  const updateTask = useStore((s) => s.updateTask);
  const createTask = useStore((s) => s.createTask);

  const projectTasks = useMemo(
    () =>
      allTasks
        .filter((t) => t.projectId === projectId)
        .sort((a, b) => a.position - b.position),
    [allTasks, projectId]
  );

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = {
      TODO: [], IN_PROGRESS: [], BLOCKED: [], DONE: [],
    };
    for (const t of projectTasks) g[t.status].push(t);
    return g;
  }, [projectTasks]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 6 } }),
    useSensor(KeyboardSensor)
  );

  function findContainer(id: string): TaskStatus | null {
    if (STATUS_ORDER.includes(id as TaskStatus)) return id as TaskStatus;
    const t = projectTasks.find((x) => x.id === id);
    return t?.status ?? null;
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(over.id));
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;
    // Move across columns immediately for live feel
    const t = projectTasks.find((x) => x.id === active.id);
    if (!t) return;
    moveTask(t.id, overContainer, t.position);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const t = projectTasks.find((x) => x.id === active.id);
    if (!t) return;
    const targetStatus = findContainer(String(over.id));
    if (!targetStatus) return;

    // Determine new position by neighbour
    const list = projectTasks
      .filter((x) => x.status === targetStatus)
      .filter((x) => x.id !== t.id);
    const overIdx = list.findIndex((x) => x.id === over.id);

    let newPos: number;
    if (overIdx === -1) {
      // dropped on column body
      newPos = (list[list.length - 1]?.position ?? 0) + 1024;
    } else {
      const before = list[overIdx - 1]?.position;
      const at = list[overIdx]?.position;
      newPos = before == null ? at - 512 : (before + at) / 2;
    }
    moveTask(t.id, targetStatus, newPos);
  }

  const activeTask = activeId ? projectTasks.find((t) => t.id === activeId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto px-6 pb-6 scrollbar-thin">
          {STATUS_ORDER.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={grouped[status]}
              onAdd={(title) =>
                createTask({ title, projectId, status })
              }
              onOpen={setOpenId}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {openId ? <TaskDrawer taskId={openId} onClose={() => setOpenId(null)} /> : null}
    </>
  );
}

function Column({
  status,
  tasks,
  onAdd,
  onOpen,
}: {
  status: TaskStatus;
  tasks: Task[];
  onAdd: (title: string) => void;
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useSortable({ id: status });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const accent: Record<TaskStatus, string> = {
    TODO: "bg-muted",
    IN_PROGRESS: "bg-primary/10 text-primary",
    BLOCKED: "bg-destructive/10 text-destructive",
    DONE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-80 shrink-0 flex-col rounded-lg border border-border bg-card/40 transition-colors",
        isOver && "border-primary/40 bg-primary/[0.04]"
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
          <span>{STATUS_LABEL[status]}</span>
          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", accent[status])}>
            {tasks.length}
          </span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => setAdding(true)}
          aria-label="Add task"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2 scrollbar-thin">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onOpen={onOpen} />
          ))}

          {adding ? (
            <div className="rounded-md border border-border bg-card p-2 shadow-soft">
              <Input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && draft.trim()) {
                    onAdd(draft.trim());
                    setDraft("");
                    setAdding(false);
                  }
                  if (e.key === "Escape") {
                    setAdding(false);
                    setDraft("");
                  }
                }}
                placeholder="New task title"
                className="h-8"
              />
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (draft.trim()) onAdd(draft.trim());
                    setDraft("");
                    setAdding(false);
                  }}
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAdding(false);
                    setDraft("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          {!adding && tasks.length === 0 ? (
            <button
              onClick={() => setAdding(true)}
              className="rounded-md border border-dashed border-border py-6 text-xs text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors"
            >
              + Add a task
            </button>
          ) : null}
        </div>
      </SortableContext>
    </div>
  );
}
