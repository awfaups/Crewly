export type MemberKind = "human" | "ai";

export type Presence = "online" | "busy" | "away";

export type ModelProvider =
  | "OpenAI"
  | "Anthropic"
  | "DeepSeek"
  | "通义千问"
  | "智谱 AI"
  | "Ollama"
  | "自定义";

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

export type Attachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
};

export type Workspace = {
  id: string;
  name: string;
  description: string;
  health: string;
  activeMembers: number;
};

export type ModelConfig = {
  provider: ModelProvider;
  model: string;
  endpointHint?: string;
};

export type Member = {
  id: string;
  name: string;
  kind: MemberKind;
  role: string;
  avatar: string;
  presence: Presence;
  modelConfig?: ModelConfig;
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
  attachments?: Attachment[];
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
  archived?: boolean;
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
