import type {
  Comment,
  Label,
  Membership,
  Notification,
  Project,
  Task,
  User,
  Workspace,
} from "./types";

// --- Mock seed data --------------------------------------------------------
// Used to populate the initial UI state on first load. Persists to
// localStorage thereafter via the zustand persist middleware.

const now = Date.now();
const days = (n: number) => new Date(now + n * 86400_000).toISOString();

export const SEED_USERS: User[] = [
  { id: "u_priya", email: "priya@taskflow.ai", displayName: "Priya Iyer" },
  { id: "u_marco", email: "marco@taskflow.ai", displayName: "Marco Bianchi" },
  { id: "u_amara", email: "amara@taskflow.ai", displayName: "Amara Okafor" },
  { id: "u_lin", email: "lin@taskflow.ai", displayName: "Lin Wei" },
  { id: "u_sam", email: "sam@taskflow.ai", displayName: "Sam Hartley" },
];

export const SEED_CURRENT_USER_ID = "u_priya";

export const SEED_WORKSPACE: Workspace = {
  id: "w_default",
  name: "Atelier",
  slug: "atelier",
  timezone: "Europe/London",
};

export const SEED_MEMBERSHIPS: Membership[] = [
  { workspaceId: "w_default", userId: "u_priya", role: "OWNER" },
  { workspaceId: "w_default", userId: "u_marco", role: "ADMIN" },
  { workspaceId: "w_default", userId: "u_amara", role: "MEMBER" },
  { workspaceId: "w_default", userId: "u_lin", role: "MEMBER" },
  { workspaceId: "w_default", userId: "u_sam", role: "VIEWER" },
];

export const SEED_PROJECTS: Project[] = [
  {
    id: "p_launch",
    workspaceId: "w_default",
    name: "Q2 Product Launch",
    description: "Public launch of the v2 platform across web and partner channels.",
    emoji: "🚀",
    createdAt: days(-21),
  },
  {
    id: "p_brand",
    workspaceId: "w_default",
    name: "Brand Refresh",
    description: "New identity system, typography, and component library.",
    emoji: "🎨",
    createdAt: days(-12),
  },
  {
    id: "p_research",
    workspaceId: "w_default",
    name: "User Research",
    description: "Qualitative interviews with 12 power users.",
    emoji: "🔍",
    createdAt: days(-6),
  },
];

export const SEED_LABELS: Label[] = [
  { id: "l_fe", workspaceId: "w_default", name: "frontend", color: "#C96442" },
  { id: "l_be", workspaceId: "w_default", name: "backend", color: "#3D7A8A" },
  { id: "l_design", workspaceId: "w_default", name: "design", color: "#8E7CC3" },
  { id: "l_research", workspaceId: "w_default", name: "research", color: "#7A9D54" },
  { id: "l_blocker", workspaceId: "w_default", name: "blocker", color: "#B33A3A" },
];

let pos = 0;
const p = () => (pos += 1024);

export const SEED_TASKS: Task[] = [
  {
    id: "t_1", projectId: "p_launch", title: "Draft launch announcement",
    description: "300-word announcement for the blog and email list. Include the three flagship capabilities.",
    status: "IN_PROGRESS", priority: "P1", assigneeId: "u_priya",
    dueDate: days(2), position: p(), labelIds: ["l_design"], version: 1,
    createdById: "u_priya", createdAt: days(-4), updatedAt: days(-1),
  },
  {
    id: "t_2", projectId: "p_launch", title: "Coordinate press embargo",
    description: "Reach out to TechCrunch, The Verge, and Stratechery one week before launch.",
    status: "TODO", priority: "P0", assigneeId: "u_marco",
    dueDate: days(5), position: p(), labelIds: [], version: 0,
    createdById: "u_marco", createdAt: days(-3), updatedAt: days(-3),
  },
  {
    id: "t_3", projectId: "p_launch", title: "Ship pricing page A/B test",
    description: "Variant B uses social proof above the fold.",
    status: "BLOCKED", priority: "P1", assigneeId: "u_amara",
    dueDate: days(1), position: p(), labelIds: ["l_fe", "l_blocker"], version: 2,
    createdById: "u_marco", createdAt: days(-6), updatedAt: days(0),
  },
  {
    id: "t_4", projectId: "p_launch", title: "Stress test signup flow at 5x load",
    status: "TODO", priority: "P2", assigneeId: "u_lin",
    dueDate: days(7), position: p(), labelIds: ["l_be"], version: 0,
    createdById: "u_lin", createdAt: days(-2), updatedAt: days(-2),
  },
  {
    id: "t_5", projectId: "p_launch", title: "Final design review with leadership",
    status: "DONE", priority: "P2", assigneeId: "u_priya",
    dueDate: days(-2), position: p(), labelIds: ["l_design"], version: 3,
    createdById: "u_priya", createdAt: days(-10), updatedAt: days(-2),
  },
  {
    id: "t_6", projectId: "p_launch", title: "Update onboarding screencasts",
    status: "TODO", priority: "P3", assigneeId: null,
    dueDate: days(10), position: p(), labelIds: [], version: 0,
    createdById: "u_priya", createdAt: days(-1), updatedAt: days(-1),
  },
  {
    id: "t_7", projectId: "p_brand", title: "Lock in display typeface",
    description: "Down to Söhne vs. Tiempos. Recommend Tiempos for editorial warmth.",
    status: "IN_PROGRESS", priority: "P1", assigneeId: "u_priya",
    dueDate: days(3), position: p(), labelIds: ["l_design"], version: 1,
    createdById: "u_priya", createdAt: days(-7), updatedAt: days(-1),
  },
  {
    id: "t_8", projectId: "p_brand", title: "Audit colour contrast for WCAG AA",
    status: "TODO", priority: "P1", assigneeId: "u_amara",
    dueDate: days(4), position: p(), labelIds: ["l_design", "l_fe"], version: 0,
    createdById: "u_priya", createdAt: days(-5), updatedAt: days(-5),
  },
  {
    id: "t_9", projectId: "p_research", title: "Recruit 12 power users for interviews",
    status: "IN_PROGRESS", priority: "P1", assigneeId: "u_marco",
    dueDate: days(6), position: p(), labelIds: ["l_research"], version: 0,
    createdById: "u_marco", createdAt: days(-3), updatedAt: days(-1),
  },
  {
    id: "t_10", projectId: "p_research", title: "Synthesise findings into themes",
    status: "TODO", priority: "P2", assigneeId: "u_priya",
    dueDate: days(14), position: p(), labelIds: ["l_research"], version: 0,
    createdById: "u_priya", createdAt: days(-2), updatedAt: days(-2),
  },
];

export const SEED_COMMENTS: Comment[] = [
  {
    id: "c_1", taskId: "t_3", authorId: "u_amara",
    body: "Blocked on legal sign-off for the social proof testimonials. @u_marco can you ping them?",
    createdAt: days(-1),
  },
  {
    id: "c_2", taskId: "t_3", authorId: "u_marco",
    body: "Pinged. Expecting an answer by EOD tomorrow.",
    createdAt: days(0),
  },
  {
    id: "c_3", taskId: "t_1", authorId: "u_marco",
    body: "Read the draft — the second paragraph buries the AI angle. Lift it up?",
    createdAt: days(0),
  },
];

export const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "n_1", userId: "u_priya", type: "MENTIONED",
    payload: { taskId: "t_3", message: "Amara mentioned you on Ship pricing page A/B test", actorId: "u_amara" },
    createdAt: days(-1), readAt: null,
  },
  {
    id: "n_2", userId: "u_priya", type: "COMMENTED",
    payload: { taskId: "t_1", message: "Marco commented on Draft launch announcement", actorId: "u_marco" },
    createdAt: days(0), readAt: null,
  },
  {
    id: "n_3", userId: "u_priya", type: "STATUS_BLOCKED",
    payload: { taskId: "t_3", message: "Ship pricing page A/B test is blocked" },
    createdAt: days(0), readAt: days(0),
  },
  {
    id: "n_4", userId: "u_priya", type: "AI_SUGGESTION",
    payload: { projectId: "p_launch", message: "5 new task suggestions are ready for Q2 Product Launch" },
    createdAt: days(0), readAt: null,
  },
];
