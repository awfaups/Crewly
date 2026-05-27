export type MemberKind = "human" | "ai";

export type Presence = "online" | "busy" | "away";

export type TaskStatus = "todo" | "doing" | "review" | "done";

export type TaskPriority = "高" | "中" | "低";

export type SessionStatus = "running" | "waiting_approval" | "completed";

export type RuntimeEventType =
  | "message"
  | "thinking"
  | "tool"
  | "result"
  | "approval";

export type ApprovalStatus = "pending" | "approved" | "denied";

export type Workspace = {
  id: string;
  name: string;
  description: string;
  health: string;
  activeMembers: number;
};

export type Member = {
  id: string;
  name: string;
  kind: MemberKind;
  role: string;
  avatar: string;
  presence: Presence;
};

export type Channel = {
  id: string;
  name: string;
  topic: string;
  unread: number;
};

export type Message = {
  id: string;
  channelId: string;
  authorId: string;
  time: string;
  body: string;
  linkedTaskId?: string;
  linkedApprovalId?: string;
};

export type Task = {
  id: string;
  title: string;
  summary: string;
  status: TaskStatus;
  priority: TaskPriority;
  label: string;
  due: string;
  assigneeId: string;
  channelId: string;
  sessionId: string;
};

export type RuntimeEvent = {
  id: string;
  type: RuntimeEventType;
  title: string;
  detail: string;
  time: string;
};

export type AgentSession = {
  id: string;
  title: string;
  ownerId: string;
  taskId: string;
  status: SessionStatus;
  startedAt: string;
  events: RuntimeEvent[];
};

export type Approval = {
  id: string;
  title: string;
  summary: string;
  requesterId: string;
  taskId: string;
  status: ApprovalStatus;
  risk: string;
};
