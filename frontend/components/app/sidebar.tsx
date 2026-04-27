"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  LayoutDashboard,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function Sidebar() {
  const pathname = usePathname();
  const projects = useStore((s) => s.projects);
  const notifications = useStore((s) => s.notifications);
  const me = useStore((s) => s.currentUser());

  const unread = notifications.filter((n) => !n.readAt && n.userId === me?.id).length;

  const NavLink = ({
    href,
    icon,
    label,
    badge,
  }: {
    href: string;
    icon: React.ReactNode;
    label: string;
    badge?: number;
  }) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={cn(
          "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
          active
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        )}
      >
        <span className="text-muted-foreground group-hover:text-foreground">{icon}</span>
        <span>{label}</span>
        {badge && badge > 0 ? (
          <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            {badge}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
      {/* Workspace */}
      <div className="flex items-center gap-2 px-4 py-4">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
          <span className="font-display text-sm leading-none">τ</span>
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold leading-tight">Atelier</div>
          <div className="truncate text-[11px] text-muted-foreground">5 members</div>
        </div>
      </div>

      <nav className="space-y-0.5 px-2">
        <NavLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
        <NavLink href="/inbox" icon={<Inbox className="h-4 w-4" />} label="Inbox" badge={unread} />
        <NavLink href="/ai" icon={<Sparkles className="h-4 w-4" />} label="Co-pilot" />
        <NavLink href="/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />
      </nav>

      <div className="mt-6 flex items-center justify-between px-4">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Projects
        </span>
        <NewProjectDialog />
      </div>

      <div className="mt-1 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4 scrollbar-thin">
        {projects.map((p) => {
          const href = `/projects/${p.id}`;
          const active = pathname === href;
          return (
            <Link
              key={p.id}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <span className="text-base leading-none">{p.emoji ?? "•"}</span>
              <span className="truncate">{p.name}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

function NewProjectDialog() {
  const create = useStore((s) => s.createProject);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [description, setDescription] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="New project">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            Projects organise tasks within a workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-[64px_1fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="emoji">Icon</Label>
              <Input
                id="emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={2}
                className="text-center"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Q3 marketing campaign"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project for?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!name.trim()) return;
              create({ name, emoji, description });
              toast({ title: "Project created", variant: "success" });
              setOpen(false);
              setName("");
              setDescription("");
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
