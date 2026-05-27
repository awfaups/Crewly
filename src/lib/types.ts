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

export type ModelAuthType = "Bearer Token" | "API Key Header" | "无认证" | "自定义";

export type ModelEnvironment = "开发" | "测试" | "生产";

export type MemoryScope = "仅当前频道" | "当前工作区" | "跨工作区";

export type SkillInvocationMode = "自动调用" | "调用前确认" | "手动调用";

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
  apiKeyRef: string;
  authType: ModelAuthType;
  baseUrl: string;
  capabilities: {
    functionCalling: boolean;
    imageInput: boolean;
    jsonMode: boolean;
    streaming: boolean;
  };
  endpointHint?: string;
  environment: ModelEnvironment;
  maxTokens: number;
  model: string;
  organizationId?: string;
  projectId?: string;
  provider: ModelProvider;
  temperature: number;
  timeoutSeconds: number;
};

export type TeammateMemoryConfig = {
  enabled: boolean;
  notes: string;
  retentionDays: number;
  scope: MemoryScope;
};

export type InstalledSkill = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

export type TeammateSkillConfig = {
  installedSkills: InstalledSkill[];
  invocationMode: SkillInvocationMode;
  requireApprovalForExternalActions: boolean;
};

export type Member = {
  id: string;
  name: string;
  kind: MemberKind;
  role: string;
  avatar: string;
  presence: Presence;
  archived?: boolean;
  memoryConfig?: TeammateMemoryConfig;
  modelConfig?: ModelConfig;
  skillConfig?: TeammateSkillConfig;
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
