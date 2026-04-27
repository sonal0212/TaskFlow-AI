"use client";

import { useState } from "react";
import { Topbar } from "@/components/app/topbar";
import { AiPanel } from "@/components/ai/ai-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";

export default function AiPage() {
  const projects = useStore((s) => s.projects);
  const [pid, setPid] = useState(projects[0]?.id);

  return (
    <>
      <Topbar title="Co-pilot" />
      <main className="container max-w-5xl py-8">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            AI surface
          </p>
          <h2 className="font-display mt-2 text-4xl tracking-tight">
            Ask the co-pilot.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Suggest the next moves, re-prioritise the backlog, or turn a sentence
            into a structured task. All previews are reviewed before anything writes.
          </p>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Project context
          </span>
          <Select value={pid} onValueChange={setPid}>
            <SelectTrigger className="h-8 w-[260px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.emoji} {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <div className="h-[640px]">
            <AiPanel projectId={pid} />
          </div>
        </div>
      </main>
    </>
  );
}
