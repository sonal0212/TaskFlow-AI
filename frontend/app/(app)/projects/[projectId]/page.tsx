"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, Sparkles, Users } from "lucide-react";
import { Topbar } from "@/components/app/topbar";
import { Board } from "@/components/board/board";
import { AiPanel } from "@/components/ai/ai-panel";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const projects = useStore((s) => s.projects);
  const project = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId]
  );
  const memberships = useStore((s) => s.memberships);
  const users = useStore((s) => s.users);
  const activeWorkspaceId = useStore((s) => s.activeWorkspaceId);
  const tasks = useStore((s) => s.tasks);

  const members = useMemo(() => {
    const ids = memberships
      .filter((m) => m.workspaceId === activeWorkspaceId)
      .map((m) => m.userId);
    return users.filter((u) => ids.includes(u.id));
  }, [memberships, users, activeWorkspaceId]);

  const [aiOpen, setAiOpen] = useState(false);

  // Simulated presence — pick a few rotating members as "currently viewing"
  const presentMembers = useMemo(() => members.slice(0, 3), [members]);

  if (!project) {
    return (
      <div className="grid h-full place-items-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Project not found.</p>
          <Button variant="outline" asChild className="mt-4">
            <a href="/dashboard">
              <ChevronLeft className="h-4 w-4" /> Back to dashboard
            </a>
          </Button>
        </div>
      </div>
    );
  }

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const open = projectTasks.filter((t) => t.status !== "DONE").length;

  return (
    <>
      <Topbar
        title={
          <span className="inline-flex items-center gap-2">
            <span>{project.emoji}</span>
            <span>{project.name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              · {open} open
            </span>
          </span>
        }
      />

      <div className="flex flex-1 min-h-0 flex-col">
        {/* Project header bar */}
        <div className="flex items-center justify-between border-b border-border bg-card/30 px-6 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">
              {project.description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="mr-1 hidden text-xs text-muted-foreground sm:inline">
                <Users className="mr-1 inline h-3 w-3" />
                Now viewing
              </span>
              <div className="flex -space-x-2">
                {presentMembers.map((m) => (
                  <Tooltip key={m.id}>
                    <TooltipTrigger asChild>
                      <span className="ring-2 ring-background rounded-full">
                        <UserAvatar name={m.displayName} size="sm" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{m.displayName}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
            <Button
              size="sm"
              variant={aiOpen ? "default" : "outline"}
              onClick={() => setAiOpen((v) => !v)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Co-pilot
            </Button>
          </div>
        </div>

        {/* Board + AI panel */}
        <div className="flex flex-1 min-h-0">
          <div className="flex flex-1 min-w-0 flex-col pt-4">
            <Board projectId={project.id} />
          </div>
          <aside
            className={cn(
              "border-l border-border bg-card/40 transition-[width] duration-200 ease-out",
              aiOpen ? "w-96" : "w-0 overflow-hidden"
            )}
          >
            {aiOpen ? <AiPanel projectId={project.id} /> : null}
          </aside>
        </div>
      </div>
    </>
  );
}
