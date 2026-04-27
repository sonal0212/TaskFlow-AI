// Domain types — mirror the backend BRD section 10.

export type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
export type TaskPriority = "P0" | "P1" | "P2" | "P3";

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  timezone: string;
}

export interface Membership {
  workspaceId: string;
  userId: string;
  role: Role;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  emoji?: string;
  createdAt: string;
}

export interface Label {
  id: string;
  workspaceId: string;
  name: string;
  color: string; // hex
}

export interface Task {
  id: string;
  projectId: string;
  parentId?: string | null;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null; // ISO date
  position: number;
  labelIds: string[];
  version: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export type NotificationType =
  | "ASSIGNED"
  | "MENTIONED"
  | "COMMENTED"
  | "STATUS_BLOCKED"
  | "AI_SUGGESTION";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  payload: { taskId?: string; projectId?: string; message: string; actorId?: string };
  readAt?: string | null;
  createdAt: string;
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  P0: "Critical",
  P1: "High",
  P2: "Medium",
  P3: "Low",
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  DONE: "Done",
};

export const STATUS_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];
