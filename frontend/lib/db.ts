"use client";

/**
 * Supabase data-access layer.
 *
 * Each function maps a snake_case Postgres row to our camelCase domain type.
 * The zustand store calls these on hydration and for every mutation, then
 * mirrors the result locally so the UI stays snappy.
 */

import { getSupabase, SUPABASE_CONFIGURED } from "./supabase";
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

export const dbAvailable = SUPABASE_CONFIGURED;

// ── Row → domain mappers ────────────────────────────────────────────
const toUser = (r: any): User => ({
  id: r.id,
  email: r.email,
  displayName: r.display_name,
  avatarUrl: r.avatar_url,
});
const toWorkspace = (r: any): Workspace => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  timezone: r.timezone,
});
const toMembership = (r: any): Membership => ({
  workspaceId: r.workspace_id,
  userId: r.user_id,
  role: r.role,
});
const toProject = (r: any): Project => ({
  id: r.id,
  workspaceId: r.workspace_id,
  name: r.name,
  description: r.description,
  emoji: r.emoji,
  createdAt: r.created_at,
});
const toLabel = (r: any): Label => ({
  id: r.id,
  workspaceId: r.workspace_id,
  name: r.name,
  color: r.color,
});
const toTask = (r: any, labelIds: string[] = []): Task => ({
  id: r.id,
  projectId: r.project_id,
  parentId: r.parent_id,
  title: r.title,
  description: r.description ?? "",
  status: r.status,
  priority: r.priority,
  assigneeId: r.assignee_id,
  dueDate: r.due_date,
  position: Number(r.position),
  labelIds,
  version: r.version,
  createdById: r.created_by,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
const toComment = (r: any): Comment => ({
  id: r.id,
  taskId: r.task_id,
  authorId: r.author_id,
  body: r.body,
  createdAt: r.created_at,
});
const toNotification = (r: any): Notification => ({
  id: r.id,
  userId: r.user_id,
  type: r.type,
  payload: r.payload,
  readAt: r.read_at,
  createdAt: r.created_at,
});

// ── Bulk hydration ──────────────────────────────────────────────────
export interface HydratedSnapshot {
  users: User[];
  workspaces: Workspace[];
  memberships: Membership[];
  projects: Project[];
  tasks: Task[];
  labels: Label[];
  comments: Comment[];
  notifications: Notification[];
}

export async function hydrateAll(): Promise<HydratedSnapshot> {
  const sb = getSupabase();
  const [users, workspaces, memberships, projects, labels, tasks, taskLabels, comments, notifications] =
    await Promise.all([
      sb.from("users").select("*"),
      sb.from("workspaces").select("*"),
      sb.from("memberships").select("*"),
      sb.from("projects").select("*").is("archived_at", null),
      sb.from("labels").select("*"),
      sb.from("tasks").select("*").is("deleted_at", null),
      sb.from("task_labels").select("*"),
      sb.from("comments").select("*"),
      sb.from("notifications").select("*"),
    ]);

  for (const r of [users, workspaces, memberships, projects, labels, tasks, taskLabels, comments, notifications]) {
    if (r.error) throw new Error(`Supabase load failed: ${r.error.message}`);
  }

  // Fold task_labels into each task
  const labelsByTask = new Map<string, string[]>();
  for (const tl of taskLabels.data ?? []) {
    const arr = labelsByTask.get(tl.task_id) ?? [];
    arr.push(tl.label_id);
    labelsByTask.set(tl.task_id, arr);
  }

  return {
    users: (users.data ?? []).map(toUser),
    workspaces: (workspaces.data ?? []).map(toWorkspace),
    memberships: (memberships.data ?? []).map(toMembership),
    projects: (projects.data ?? []).map(toProject),
    labels: (labels.data ?? []).map(toLabel),
    tasks: (tasks.data ?? []).map((t) => toTask(t, labelsByTask.get(t.id) ?? [])),
    comments: (comments.data ?? []).map(toComment),
    notifications: (notifications.data ?? []).map(toNotification),
  };
}

// ── Auth helpers ────────────────────────────────────────────────────
export async function findUserByEmail(email: string): Promise<User | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("users")
    .select("*")
    .ilike("email", email)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data ? toUser(data) : null;
}

export async function createUser(input: {
  email: string;
  displayName: string;
}): Promise<User> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("users")
    .insert({ email: input.email, display_name: input.displayName })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toUser(data);
}

// ── Tasks ───────────────────────────────────────────────────────────
export async function createTask(input: {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
  createdById: string;
  position: number;
}): Promise<Task> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("tasks")
    .insert({
      project_id: input.projectId,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "TODO",
      priority: input.priority ?? "P2",
      assignee_id: input.assigneeId ?? null,
      due_date: input.dueDate ?? null,
      position: input.position,
      created_by: input.createdById,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toTask(data, []);
}

export async function patchTask(id: string, patch: Partial<Task>): Promise<void> {
  const sb = getSupabase();
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.priority !== undefined) row.priority = patch.priority;
  if (patch.assigneeId !== undefined) row.assignee_id = patch.assigneeId;
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
  if (patch.position !== undefined) row.position = patch.position;
  row.updated_at = new Date().toISOString();
  const { error } = await sb.from("tasks").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function softDeleteTask(id: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Comments ────────────────────────────────────────────────────────
export async function createComment(input: {
  taskId: string;
  authorId: string;
  body: string;
}): Promise<Comment> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("comments")
    .insert({
      task_id: input.taskId,
      author_id: input.authorId,
      body: input.body,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toComment(data);
}

// ── Projects ────────────────────────────────────────────────────────
export async function createProject(input: {
  workspaceId: string;
  name: string;
  emoji?: string;
  description?: string;
  createdById: string;
}): Promise<Project> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("projects")
    .insert({
      workspace_id: input.workspaceId,
      name: input.name,
      emoji: input.emoji ?? null,
      description: input.description ?? null,
      created_by: input.createdById,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toProject(data);
}

// ── Notifications ───────────────────────────────────────────────────
export async function markNotificationRead(id: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw new Error(error.message);
}
