"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Comment,
  Label,
  Membership,
  Notification,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
  User,
  Workspace,
} from "./types";
import * as db from "./db";

interface State {
  // session
  authedUserId: string | null;

  // collections — populated by hydrate(); empty until then.
  users: User[];
  workspaces: Workspace[];
  memberships: Membership[];
  projects: Project[];
  tasks: Task[];
  labels: Label[];
  comments: Comment[];
  notifications: Notification[];

  // ephemeral UI state
  activeWorkspaceId: string;
  activeProjectId: string | null;

  // hydration status
  hydrated: boolean;
  hydrating: boolean;
  hydrationError: string | null;

  // ── actions ────────────────────────────────────────────────────
  hydrate: () => Promise<void>;

  login: (email: string) => Promise<boolean>;
  logout: () => void;
  signup: (input: { email: string; displayName: string }) => Promise<void>;

  currentUser: () => User | null;

  createTask: (input: Partial<Task> & Pick<Task, "title" | "projectId">) => Promise<Task | null>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, status: TaskStatus, position: number) => Promise<void>;

  addComment: (taskId: string, body: string) => Promise<void>;

  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  createProject: (input: { name: string; emoji?: string; description?: string }) => Promise<Project | null>;

  setActiveProject: (id: string | null) => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      authedUserId: null,

      users: [],
      workspaces: [],
      memberships: [],
      projects: [],
      tasks: [],
      labels: [],
      comments: [],
      notifications: [],

      activeWorkspaceId: "",
      activeProjectId: null,

      hydrated: false,
      hydrating: false,
      hydrationError: null,

      // ── Hydration ────────────────────────────────────────────
      hydrate: async () => {
        if (!db.dbAvailable) {
          set({ hydrated: true, hydrationError: "Supabase env vars missing." });
          return;
        }
        if (get().hydrating) return;
        set({ hydrating: true, hydrationError: null });
        try {
          const snap = await db.hydrateAll();
          const firstWorkspace = snap.workspaces[0]?.id ?? "";
          const firstProject = snap.projects[0]?.id ?? null;
          set({
            ...snap,
            activeWorkspaceId: firstWorkspace,
            activeProjectId: get().activeProjectId ?? firstProject,
            hydrated: true,
            hydrating: false,
          });
        } catch (e) {
          set({
            hydrating: false,
            hydrated: true,
            hydrationError: e instanceof Error ? e.message : String(e),
          });
        }
      },

      // ── Auth (DB-backed) ─────────────────────────────────────
      login: async (email) => {
        try {
          const user = await db.findUserByEmail(email);
          if (!user) return false;
          set({ authedUserId: user.id });
          return true;
        } catch {
          return false;
        }
      },

      logout: () => set({ authedUserId: null }),

      signup: async ({ email, displayName }) => {
        const newUser = await db.createUser({ email, displayName });
        set((s) => ({
          users: [...s.users, newUser],
          authedUserId: newUser.id,
        }));
      },

      currentUser: () => {
        const id = get().authedUserId;
        return id ? get().users.find((u) => u.id === id) ?? null : null;
      },

      // ── Tasks ────────────────────────────────────────────────
      createTask: async (input) => {
        const me = get().authedUserId;
        if (!me) return null;
        const projectTasks = get().tasks.filter((t) => t.projectId === input.projectId);
        const maxPos = projectTasks.reduce((m, t) => Math.max(m, t.position), 0);
        try {
          const task = await db.createTask({
            projectId: input.projectId,
            title: input.title,
            description: input.description ?? "",
            status: input.status ?? "TODO",
            priority: input.priority ?? "P2",
            assigneeId: input.assigneeId ?? null,
            dueDate: input.dueDate ?? null,
            createdById: me,
            position: maxPos + 1024,
          });
          set((s) => ({ tasks: [...s.tasks, task] }));
          return task;
        } catch (e) {
          console.error("createTask failed", e);
          return null;
        }
      },

      updateTask: async (id, patch) => {
        // Optimistic local update first; reconcile if Supabase rejects.
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...patch,
                  version: t.version + 1,
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
        try { await db.patchTask(id, patch); }
        catch (e) { console.error("patchTask failed", e); }
      },

      deleteTask: async (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
        try { await db.softDeleteTask(id); }
        catch (e) { console.error("softDeleteTask failed", e); }
      },

      moveTask: async (id, status, position) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status, position, updatedAt: new Date().toISOString(), version: t.version + 1 }
              : t
          ),
        }));
        try { await db.patchTask(id, { status, position }); }
        catch (e) { console.error("moveTask failed", e); }
      },

      // ── Comments ─────────────────────────────────────────────
      addComment: async (taskId, body) => {
        const me = get().authedUserId;
        if (!me) return;
        try {
          const c = await db.createComment({ taskId, authorId: me, body });
          set((s) => ({ comments: [...s.comments, c] }));
        } catch (e) { console.error("addComment failed", e); }
      },

      // ── Notifications ────────────────────────────────────────
      markNotificationRead: async (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, readAt: new Date().toISOString() } : n
          ),
        }));
        try { await db.markNotificationRead(id); }
        catch (e) { console.error(e); }
      },

      markAllNotificationsRead: async () => {
        const me = get().authedUserId;
        if (!me) return;
        const now = new Date().toISOString();
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.readAt ? n : { ...n, readAt: now }
          ),
        }));
        try { await db.markAllNotificationsRead(me); }
        catch (e) { console.error(e); }
      },

      // ── Projects ─────────────────────────────────────────────
      createProject: async ({ name, emoji, description }) => {
        const me = get().authedUserId;
        const ws = get().activeWorkspaceId;
        if (!me || !ws) return null;
        try {
          const project = await db.createProject({
            workspaceId: ws,
            name,
            emoji,
            description,
            createdById: me,
          });
          set((s) => ({
            projects: [...s.projects, project],
            activeProjectId: project.id,
          }));
          return project;
        } catch (e) {
          console.error("createProject failed", e);
          return null;
        }
      },

      setActiveProject: (id) => set({ activeProjectId: id }),
    }),
    {
      name: "taskflow-ai-store",
      // Only persist session + ephemeral UI state. Collections are
      // re-hydrated from Supabase on mount so we never serve stale
      // data after a deploy or DB edit.
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? ({
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            } as unknown as Storage)
          : localStorage
      ),
      partialize: (s) => ({
        authedUserId: s.authedUserId,
        activeWorkspaceId: s.activeWorkspaceId,
        activeProjectId: s.activeProjectId,
      }),
    }
  )
);

// Selectors -----------------------------------------------------------------
export const usePriorityColor = (p: TaskPriority) => {
  switch (p) {
    case "P0": return "text-priority-p0 border-priority-p0/40 bg-priority-p0/10";
    case "P1": return "text-priority-p1 border-priority-p1/40 bg-priority-p1/10";
    case "P2": return "text-priority-p2 border-priority-p2/40 bg-priority-p2/10";
    case "P3": return "text-priority-p3 border-priority-p3/40 bg-priority-p3/10";
  }
};
