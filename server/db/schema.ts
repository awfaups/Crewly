import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const memberKind = pgEnum("member_kind", ["human", "ai"]);
export const presence = pgEnum("presence", ["online", "busy", "away"]);
export const taskStatus = pgEnum("task_status", ["todo", "doing", "review", "done"]);
export const taskPriority = pgEnum("task_priority", ["高", "中", "低"]);
export const sessionStatus = pgEnum("session_status", ["running", "waiting_approval", "completed"]);
export const runtimeEventType = pgEnum("runtime_event_type", ["message", "thinking", "tool", "result", "approval"]);
export const approvalStatus = pgEnum("approval_status", ["pending", "approved", "denied"]);
export const skillRiskLevel = pgEnum("skill_risk_level", ["低", "中", "高"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  health: text("health").notNull().default(""),
  ...timestamps,
});

export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: memberKind("kind").notNull(),
  role: text("role").notNull().default(""),
  avatar: text("avatar").notNull().default("A"),
  presence: presence("presence").notNull().default("online"),
  archived: boolean("archived").notNull().default(false),
  modelConfig: jsonb("model_config"),
  memoryConfig: jsonb("memory_config"),
  skillConfig: jsonb("skill_config"),
  ...timestamps,
});

export const channels = pgTable("channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  topic: text("topic").notNull().default(""),
  unread: integer("unread").notNull().default(0),
  ...timestamps,
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => members.id, { onDelete: "set null" }),
  body: text("body").notNull().default(""),
  attachments: jsonb("attachments").notNull().default([]),
  linkedTaskId: uuid("linked_task_id"),
  linkedApprovalId: uuid("linked_approval_id"),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  assigneeId: uuid("assignee_id").references(() => members.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  status: taskStatus("status").notNull().default("todo"),
  priority: taskPriority("priority").notNull().default("中"),
  label: text("label").notNull().default("任务"),
  due: text("due").notNull().default(""),
  archived: boolean("archived").notNull().default(false),
  ...timestamps,
});

export const agentSessions = pgTable("agent_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  ownerId: uuid("owner_id").references(() => members.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  status: sessionStatus("status").notNull().default("running"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  ...timestamps,
});

export const runtimeEvents = pgTable("runtime_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => agentSessions.id, { onDelete: "cascade" }),
  type: runtimeEventType("type").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull().default(""),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
});

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  requesterId: uuid("requester_id").references(() => members.id, { onDelete: "set null" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  status: approvalStatus("status").notNull().default("pending"),
  risk: text("risk").notNull().default(""),
  decidedBy: uuid("decided_by").references(() => members.id, { onDelete: "set null" }),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  ...timestamps,
});

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull(),
  riskLevel: skillRiskLevel("risk_level").notNull().default("低"),
  source: text("source").notNull().default("Crewly Skill 市场"),
  author: text("author").notNull().default(""),
  version: text("version").notNull().default("1.0.0"),
  updatedAtText: text("updated_at_text").notNull().default(""),
  compatibility: text("compatibility").notNull().default("Crewly 0.1+"),
  permissions: jsonb("permissions").notNull().default([]),
  useCases: jsonb("use_cases").notNull().default([]),
  ...timestamps,
});

export const workspaceSkillInstalls = pgTable("workspace_skill_installs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  installedVersion: text("installed_version").notNull(),
  installedAt: timestamp("installed_at", { withTimezone: true }).defaultNow().notNull(),
});
