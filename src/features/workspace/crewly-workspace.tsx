"use client";

import {
  Activity,
  Archive,
  FileText,
  Image as ImageIcon,
  Bot,
  Check,
  ChevronRight,
  CircleDot,
  Edit3,
  Hash,
  Paperclip,
  Inbox,
  LayoutDashboard,
  Plus,
  MessageSquareText,
  Minus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  approvals as approvalSeed,
  channels as channelSeed,
  members as memberSeed,
  messages,
  skillCatalog,
  sessions,
  tasks,
  workspace,
} from "@/lib/mock-data";
import type {
  AgentSession,
  Approval,
  ApprovalStatus,
  Attachment,
  Channel,
  Member,
  Message,
  MemoryScope,
  ModelAuthType,
  ModelConfig,
  ModelEnvironment,
  ModelProvider,
  RuntimeEventType,
  SessionStatus,
  SkillCatalogItem,
  SkillCategory,
  SkillInvocationMode,
  SkillRiskLevel,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";

type PersistedWorkspaceState = {
  approvals: Approval[];
  channels: Channel[];
  members: Member[];
  messages: Message[];
  sessions: AgentSession[];
  tasks: Task[];
  workspaceSkillIds: string[];
};

type TaskFormMode = "create" | "edit";

type MemberFormMode = "create" | "edit";

type WorkspaceModule = "workspace" | "ai-teammates" | "skills";

type TaskFormState = {
  assigneeId: string;
  due: string;
  label: string;
  priority: TaskPriority;
  summary: string;
  title: string;
};

type ChannelFormState = {
  name: string;
  topic: string;
};

type MemberFormState = {
  apiKeyRef: string;
  avatar: string;
  authType: ModelAuthType;
  baseUrl: string;
  endpointHint: string;
  environment: ModelEnvironment;
  functionCalling: boolean;
  imageInput: boolean;
  installedSkillsText: string;
  jsonMode: boolean;
  maxTokens: string;
  memoryEnabled: boolean;
  memoryNotes: string;
  memoryRetentionDays: string;
  memoryScope: MemoryScope;
  modelName: string;
  modelProvider: ModelProvider;
  name: string;
  organizationId: string;
  projectId: string;
  role: string;
  skillApprovalRequired: boolean;
  skillInvocationMode: SkillInvocationMode;
  streaming: boolean;
  temperature: string;
  timeoutSeconds: string;
};

const STORAGE_KEY = "crewly.workspace.v1";
const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024;
const taskStatusOrder: TaskStatus[] = ["todo", "doing", "review", "done"];

const initialWorkspaceState: PersistedWorkspaceState = {
  approvals: approvalSeed,
  channels: channelSeed,
  members: memberSeed,
  messages,
  sessions,
  tasks,
  workspaceSkillIds: skillCatalog.slice(0, 3).map((skill) => skill.id),
};

const emptyTaskForm: TaskFormState = {
  assigneeId: "builder",
  due: "今天",
  label: "需求",
  priority: "中",
  summary: "",
  title: "",
};

const emptyChannelForm: ChannelFormState = {
  name: "",
  topic: "",
};

const emptyMemberForm: MemberFormState = {
  apiKeyRef: "OPENAI_API_KEY",
  avatar: "",
  authType: "Bearer Token",
  baseUrl: "https://api.openai.com/v1",
  endpointHint: "通过服务端代理调用，密钥由后端安全管理",
  environment: "开发",
  functionCalling: true,
  imageInput: true,
  installedSkillsText: "web-search | Web 检索 | 查找公开资料并返回来源\nrepo-inspector | 仓库分析 | 阅读代码结构和变更影响\ndoc-writer | 文档撰写 | 生成规格、验收和交付文档",
  jsonMode: true,
  maxTokens: "4096",
  memoryEnabled: true,
  memoryNotes: "保留用户偏好、项目约定、任务上下文和验收口径。",
  memoryRetentionDays: "30",
  memoryScope: "当前工作区",
  modelName: "gpt-5",
  modelProvider: "OpenAI",
  name: "",
  organizationId: "",
  projectId: "",
  role: "",
  skillApprovalRequired: false,
  skillInvocationMode: "调用前确认",
  streaming: true,
  temperature: "0.7",
  timeoutSeconds: "60",
};

const defaultModelConfig: ModelConfig = {
  apiKeyRef: "OPENAI_API_KEY",
  authType: "Bearer Token",
  baseUrl: "https://api.openai.com/v1",
  capabilities: {
    functionCalling: true,
    imageInput: true,
    jsonMode: true,
    streaming: true,
  },
  endpointHint: "通过服务端代理调用，密钥由后端安全管理",
  environment: "开发",
  maxTokens: 4096,
  provider: "OpenAI",
  model: "gpt-5",
  temperature: 0.7,
  timeoutSeconds: 60,
};

const defaultMemoryConfig = {
  enabled: true,
  notes: "保留用户偏好、项目约定、任务上下文和验收口径。",
  retentionDays: 30,
  scope: "当前工作区" as MemoryScope,
};

const defaultSkillConfig = {
  installedSkills: skillCatalog.slice(0, 3).map(catalogItemToInstalledSkill),
  invocationMode: "调用前确认" as SkillInvocationMode,
  requireApprovalForExternalActions: false,
};

const modelProviders: ModelProvider[] = [
  "OpenAI",
  "Anthropic",
  "DeepSeek",
  "通义千问",
  "智谱 AI",
  "Ollama",
  "自定义",
];

const authTypes: ModelAuthType[] = ["Bearer Token", "API Key Header", "无认证", "自定义"];

const modelEnvironments: ModelEnvironment[] = ["开发", "测试", "生产"];

const memoryScopes: MemoryScope[] = ["仅当前频道", "当前工作区", "跨工作区"];

const skillInvocationModes: SkillInvocationMode[] = ["自动调用", "调用前确认", "手动调用"];

const statusLabel: Record<TaskStatus, string> = {
  todo: "待开始",
  doing: "进行中",
  review: "待验收",
  done: "已完成",
};

const statusClass: Record<TaskStatus, string> = {
  todo: "border-stone-200 bg-stone-50 text-stone-700",
  doing: "border-sky-200 bg-sky-50 text-sky-800",
  review: "border-amber-200 bg-amber-50 text-amber-800",
  done: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const approvalLabel: Record<ApprovalStatus, string> = {
  pending: "待审批",
  approved: "已通过",
  denied: "已拒绝",
};

const eventTone: Record<RuntimeEventType, string> = {
  message: "bg-slate-100 text-slate-700",
  thinking: "bg-violet-100 text-violet-700",
  tool: "bg-cyan-100 text-cyan-700",
  result: "bg-emerald-100 text-emerald-700",
  approval: "bg-amber-100 text-amber-800",
};

export function CrewlyWorkspace() {
  const [activeModule, setActiveModule] = useState<WorkspaceModule>("workspace");
  const [activeChannelId, setActiveChannelId] = useState(channelSeed[0].id);
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0].id);
  const [selectedMemberId, setSelectedMemberId] = useState("builder");
  const [channelFormOpen, setChannelFormOpen] = useState(false);
  const [channelFormValues, setChannelFormValues] = useState<ChannelFormState>(emptyChannelForm);
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [memberFormMode, setMemberFormMode] = useState<MemberFormMode>("create");
  const [memberFormMemberId, setMemberFormMemberId] = useState<string | null>(null);
  const [memberFormValues, setMemberFormValues] = useState<MemberFormState>(emptyMemberForm);
  const [taskFormMode, setTaskFormMode] = useState<TaskFormMode>("create");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [taskFormTaskId, setTaskFormTaskId] = useState<string | null>(null);
  const [taskFormValues, setTaskFormValues] = useState<TaskFormState>(emptyTaskForm);
  const [storageReady, setStorageReady] = useState(false);
  const [workspaceState, setWorkspaceState] = useState(initialWorkspaceState);

  const {
    approvals,
    channels: workspaceChannels,
    members: workspaceMembers,
    messages: workspaceMessages,
    sessions: workspaceSessions,
    tasks: workspaceTasks,
    workspaceSkillIds,
  } = workspaceState;

  useEffect(() => {
    queueMicrotask(() => {
      setWorkspaceState(readInitialWorkspaceState());
      setStorageReady(true);
    });
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaceState));
    } catch {
      // Demo persistence should not block the workspace when storage is unavailable.
    }
  }, [storageReady, workspaceState]);

  const activeChannel = workspaceChannels.find((channel) => channel.id === activeChannelId) ?? workspaceChannels[0];
  const visibleTasks = useMemo(() => workspaceTasks.filter((task) => !task.archived), [workspaceTasks]);
  const selectedTask = visibleTasks.find((task) => task.id === selectedTaskId) ?? visibleTasks[0] ?? workspaceTasks[0];
  const selectedSession =
    workspaceSessions.find((session) => session.id === selectedTask.sessionId) ?? workspaceSessions[0];
  const selectedMember =
    workspaceMembers.find((member) => member.id === selectedMemberId) ??
    workspaceMembers.find((member) => member.id === selectedTask.assigneeId) ??
    workspaceMembers[0];
  const activeAiMembers = workspaceMembers.filter((member) => member.kind === "ai" && !member.archived);
  const assignableMembers = workspaceMembers.filter((member) => !member.archived);
  const crewlySkillCatalog = useMemo(
    () => skillCatalog.filter((skill) => workspaceSkillIds.includes(skill.id)),
    [workspaceSkillIds],
  );
  const channelMessages = workspaceMessages.filter((message) => message.channelId === activeChannel.id);
  const taskApproval =
    [...approvals].reverse().find((approval) => approval.taskId === selectedTask.id && approval.status === "pending") ??
    [...approvals].reverse().find((approval) => approval.taskId === selectedTask.id);
  const pendingApprovals = approvals.filter((approval) => approval.status === "pending");

  const taskGroups = useMemo(
    () =>
      (["todo", "doing", "review", "done"] as TaskStatus[]).map((status) => ({
        status,
        items: visibleTasks.filter((task) => task.status === status),
      })),
    [visibleTasks],
  );

  function openCreateChannelForm() {
    setChannelFormValues(emptyChannelForm);
    setChannelFormOpen(true);
  }

  function openCreateMemberForm() {
    setActiveModule("ai-teammates");
    setMemberFormMode("create");
    setMemberFormMemberId(null);
    setMemberFormValues(emptyMemberForm);
    setMemberFormOpen(true);
  }

  function openEditMemberForm(member: Member) {
    if (member.kind !== "ai") return;

    setActiveModule("ai-teammates");
    setMemberFormMode("edit");
    setMemberFormMemberId(member.id);
    setMemberFormValues(memberToFormState(member));
    setMemberFormOpen(true);
  }

  function saveChannelForm(values: ChannelFormState) {
    const name = values.name.trim();
    if (!name) return;

    const channelId = `channel-${Date.now()}`;
    const channel: Channel = {
      id: channelId,
      name,
      topic: values.topic.trim() || "新的协作频道",
      unread: 0,
    };
    const welcomeMessage: Message = {
      id: `message-${Date.now()}`,
      authorId: "navigator",
      body: `频道「${name}」已创建，可以在这里同步需求、任务和 AI 执行进展。`,
      channelId,
      time: formatNow(),
    };

    setWorkspaceState((current) => ({
      ...current,
      channels: [...current.channels, channel],
      messages: [...current.messages, welcomeMessage],
    }));
    setActiveChannelId(channelId);
    setChannelFormOpen(false);
  }

  function saveMemberForm(values: MemberFormState) {
    const name = values.name.trim();
    if (!name) return;

    if (memberFormMode === "edit" && memberFormMemberId) {
      setWorkspaceState((current) => ({
        ...current,
        members: current.members.map((member) =>
          member.id === memberFormMemberId
            ? {
                ...member,
                name,
                role: values.role.trim() || "AI 协作成员",
                avatar: normalizeAvatar(values.avatar, name),
                modelConfig: createModelConfig(values),
                memoryConfig: createMemoryConfig(values),
                skillConfig: createSkillConfig(values),
              }
            : member,
        ),
      }));
      setMemberFormOpen(false);
      return;
    }

    const memberId = `ai-${Date.now()}`;
    const member: Member = {
      id: memberId,
      name,
      kind: "ai",
      role: values.role.trim() || "AI 协作成员",
      avatar: normalizeAvatar(values.avatar, name),
      presence: "online",
      modelConfig: createModelConfig(values),
      memoryConfig: createMemoryConfig(values),
      skillConfig: createSkillConfig(values),
    };

    setWorkspaceState((current) => ({
      ...current,
      members: [...current.members, member],
    }));
    setSelectedMemberId(memberId);
    setMemberFormOpen(false);
  }

  function archiveMember(memberId: string) {
    const nextMember = activeAiMembers.find((member) => member.id !== memberId);

    setWorkspaceState((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.id === memberId
          ? {
              ...member,
              archived: true,
              presence: "away",
            }
          : member,
      ),
    }));

    if (selectedMemberId === memberId && nextMember) {
      setSelectedMemberId(nextMember.id);
    }
  }

  function decideApproval(id: string, status: ApprovalStatus) {
    setWorkspaceState((current) => {
      const approval = current.approvals.find((item) => item.id === id);
      if (!approval) return current;

      const linkedTask = current.tasks.find((task) => task.id === approval.taskId);
      const nextTaskStatus = status === "approved" ? "review" : "doing";
      const nextSessionStatus: SessionStatus = status === "approved" ? "completed" : "running";
      const eventTime = formatNow();
      const eventTitle = status === "approved" ? "审批已通过" : "审批被拒绝";
      const eventDetail =
        status === "approved"
          ? "相关任务已推进到待验收，等待人类成员做最终检查。"
          : "相关任务已回到进行中，需要 AI 成员根据反馈继续修正。";

      return {
        ...current,
        approvals: current.approvals.map((item) => (item.id === id ? { ...item, status } : item)),
        tasks: linkedTask
          ? current.tasks.map((task) =>
              task.id === linkedTask.id
                ? {
                    ...task,
                    status: nextTaskStatus,
                  }
                : task,
            )
          : current.tasks,
        sessions: linkedTask
          ? current.sessions.map((session) =>
              session.id === linkedTask.sessionId
                ? {
                    ...session,
                    status: nextSessionStatus,
                    events: [
                      ...session.events,
                      {
                        id: `event-${Date.now()}`,
                        type: "result",
                        title: eventTitle,
                        detail: eventDetail,
                        time: eventTime,
                      },
                    ],
                  }
                : session,
            )
          : current.sessions,
      };
    });
  }

  function invokeSkill(member: Member, task: Task, session: AgentSession, skill: SkillCatalogItem) {
    if (member.kind !== "ai" || !hasInstalledSkill(member, skill.id)) return;

    const skillConfig = member.skillConfig ?? defaultSkillConfig;
    const eventTime = formatNow();
    const approvalRequired = skill.riskLevel === "高" || skillConfig.requireApprovalForExternalActions;
    const approvalId = `approval-skill-${Date.now()}`;
    const toolEvent = {
      id: `event-skill-${Date.now()}`,
      type: "tool" as RuntimeEventType,
      title: `调用技能：${skill.name}`,
      detail: `${member.name} 正在基于当前任务调用「${skill.name}」。分类：${skill.category}；风险：${skill.riskLevel}。`,
      time: eventTime,
    };
    const nextEvents = approvalRequired
      ? [
          toolEvent,
          {
            id: `event-approval-${Date.now()}`,
            type: "approval" as RuntimeEventType,
            title: "等待技能调用审批",
            detail: `「${skill.name}」需要审批后继续。原因：${getSkillApprovalReason(skill, skillConfig.requireApprovalForExternalActions)}。`,
            time: eventTime,
          },
        ]
      : [
          toolEvent,
          {
            id: `event-result-${Date.now()}`,
            type: "result" as RuntimeEventType,
            title: `${skill.name} 已完成`,
            detail: createSkillResultSummary(skill, task),
            time: eventTime,
          },
        ];

    setWorkspaceState((current) => ({
      ...current,
      approvals: approvalRequired
        ? [
            ...current.approvals,
            {
              id: approvalId,
              title: `审批 ${member.name} 调用 ${skill.name}`,
              summary: `${member.name} 请求在任务「${task.title}」中调用「${skill.name}」。${skill.description}`,
              requesterId: member.id,
              taskId: task.id,
              status: "pending",
              risk: `技能风险：${skill.riskLevel}。权限范围：${skill.permissions.join("、")}。`,
            },
          ]
        : current.approvals,
      sessions: current.sessions.map((item) =>
        item.id === session.id
          ? {
              ...item,
              status: approvalRequired ? "waiting_approval" : "running",
              events: [...item.events, ...nextEvents],
            }
          : item,
      ),
      tasks: current.tasks.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status: approvalRequired ? "review" : "doing",
            }
          : item,
      ),
    }));
  }

  function installCrewlySkill(skillId: string) {
    setWorkspaceState((current) => ({
      ...current,
      workspaceSkillIds: Array.from(new Set([...current.workspaceSkillIds, skillId])),
    }));
  }

  function selectTask(task: Task) {
    setSelectedTaskId(task.id);
    setActiveChannelId(task.channelId);
    setSelectedMemberId(task.assigneeId);
  }

  function advanceTaskStatus(taskId: string) {
    setWorkspaceState((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: nextTaskStatus(task.status),
            }
          : task,
      ),
    }));
  }

  function openCreateTaskForm(seed?: Partial<TaskFormState>) {
    setTaskFormMode("create");
    setTaskFormTaskId(null);
    setTaskFormValues({
      ...emptyTaskForm,
      assigneeId: selectedMember.kind === "ai" && !selectedMember.archived ? selectedMember.id : getDefaultAssigneeId(assignableMembers),
      ...seed,
    });
    setTaskFormOpen(true);
  }

  function openEditTaskForm(task: Task) {
    setTaskFormMode("edit");
    setTaskFormTaskId(task.id);
    setTaskFormValues({
      assigneeId: task.assigneeId,
      due: task.due,
      label: task.label,
      priority: task.priority,
      summary: task.summary,
      title: task.title,
    });
    setTaskFormOpen(true);
  }

  function saveTaskForm(values: TaskFormState) {
    const title = values.title.trim();
    if (!title) return;

    if (taskFormMode === "edit" && taskFormTaskId) {
      setWorkspaceState((current) => ({
        ...current,
        sessions: current.sessions.map((session) =>
          session.taskId === taskFormTaskId
            ? {
                ...session,
                title,
              }
            : session,
        ),
        tasks: current.tasks.map((task) =>
          task.id === taskFormTaskId
            ? {
                ...task,
                ...values,
                title,
              }
            : task,
        ),
      }));
      setTaskFormOpen(false);
      return;
    }

    const taskId = `task-${Date.now()}`;
    const sessionId = `session-${Date.now()}`;
    const task: Task = {
      ...values,
      id: taskId,
      title,
      channelId: activeChannel.id,
      sessionId,
      status: "todo",
    };
    const session: AgentSession = {
      id: sessionId,
      ownerId: values.assigneeId,
      taskId,
      title,
      status: "running",
      startedAt: formatNow(),
      events: [
        {
          id: `event-${Date.now()}`,
          type: "message",
          title: "任务已创建",
          detail: values.summary || "已从工作台创建新任务。",
          time: formatNow(),
        },
      ],
    };

    setWorkspaceState((current) => ({
      ...current,
      sessions: [...current.sessions, session],
      tasks: [...current.tasks, task],
    }));
    setSelectedTaskId(taskId);
    setSelectedMemberId(values.assigneeId);
    setTaskFormOpen(false);
  }

  function archiveTask(taskId: string) {
    const nextTask = visibleTasks.find((task) => task.id !== taskId);

    setWorkspaceState((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              archived: true,
            }
          : task,
      ),
    }));

    if (selectedTaskId === taskId && nextTask) {
      selectTask(nextTask);
    }
  }

  function convertMessageToTask(message: Message) {
    if (message.linkedTaskId) return;

    const title = message.body.trim().slice(0, 28) || "来自会话的新任务";
    const taskId = `task-${Date.now()}`;
    const sessionId = `session-${Date.now()}`;
    const task: Task = {
      id: taskId,
      title,
      summary: message.body || "由附件消息转为任务。",
      status: "todo",
      priority: "中",
      label: "会话转入",
      due: "今天",
      assigneeId: "navigator",
      channelId: message.channelId,
      sessionId,
    };
    const session: AgentSession = {
      id: sessionId,
      ownerId: "navigator",
      taskId,
      title,
      status: "running",
      startedAt: formatNow(),
      events: [
        {
          id: `event-${Date.now()}`,
          type: "message",
          title: "由消息转为任务",
          detail: message.body || "该任务来自一条附件消息。",
          time: formatNow(),
        },
      ],
    };

    setWorkspaceState((current) => ({
      ...current,
      messages: current.messages.map((item) =>
        item.id === message.id
          ? {
              ...item,
              linkedTaskId: taskId,
            }
          : item,
      ),
      sessions: [...current.sessions, session],
      tasks: [...current.tasks, task],
    }));
    setSelectedTaskId(taskId);
    setSelectedMemberId("navigator");
  }

  function sendMessage(body: string, attachments: Attachment[]) {
    const trimmed = body.trim();
    if (!trimmed && attachments.length === 0) return;

    setWorkspaceState((current) => ({
      ...current,
      messages: [
        ...current.messages,
        {
          id: `message-${Date.now()}`,
          authorId: "lin",
          attachments,
          body: trimmed,
          channelId: activeChannel.id,
          time: formatNow(),
        },
      ],
    }));
  }

  function resetDemoData() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures in demo mode.
    }

    setWorkspaceState(initialWorkspaceState);
    setSelectedTaskId(tasks[0].id);
    setSelectedMemberId("builder");
    setActiveChannelId(channelSeed[0].id);
    setActiveModule("workspace");
  }

  return (
    <main className="h-dvh overflow-hidden bg-[#f4f1ea] text-slate-950">
      <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="min-h-0 overflow-y-auto border-b border-stone-200 bg-[#f8f6f0] px-4 py-4 xl:border-b-0 xl:border-r">
          <WorkspaceHeader />
          <MetricStrip activeMemberCount={workspaceMembers.length} />
          <SidebarSection title="频道">
            {workspaceChannels.map((channel) => (
              <button
                key={channel.id}
                className={`flex h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm transition ${
                  activeChannel.id === channel.id
                    ? "bg-slate-950 text-white"
                    : "text-slate-700 hover:bg-white"
                }`}
                type="button"
                onClick={() => setActiveChannelId(channel.id)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Hash className="size-4 shrink-0" />
                  <span className="truncate">{channel.name}</span>
                </span>
                {channel.unread > 0 ? (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">
                    {channel.unread}
                  </span>
                ) : null}
              </button>
            ))}
            <button
              className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-white"
              type="button"
              onClick={openCreateChannelForm}
            >
              <Plus className="size-4" />
              新建频道
            </button>
          </SidebarSection>
          <SidebarSection title="AI 成员">
            {activeAiMembers
              .map((member) => (
                <button
                  key={member.id}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition ${
                    selectedMember.id === member.id ? "bg-white shadow-sm" : "hover:bg-white"
                  }`}
                  type="button"
                  onClick={() => setSelectedMemberId(member.id)}
                >
                  <Avatar member={member} />
                  <span className="min-w-0">
                    <MemberName member={member} />
                    <span className="block truncate text-xs text-slate-500">{member.role}</span>
                  </span>
                </button>
              ))}
            <button
              className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-white"
              type="button"
              onClick={openCreateMemberForm}
            >
              <Plus className="size-4" />
              新建 AI 成员
            </button>
          </SidebarSection>
          <SidebarSection title="快捷入口">
            <SidebarShortcut
              active={activeModule === "workspace"}
              icon={<LayoutDashboard className="size-4" />}
              label="任务看板"
              onClick={() => setActiveModule("workspace")}
            />
            <SidebarShortcut
              active={activeModule === "ai-teammates"}
              icon={<Bot className="size-4" />}
              label="AI 成员管理"
              onClick={() => setActiveModule("ai-teammates")}
            />
            <SidebarShortcut
              active={activeModule === "skills"}
              icon={<Sparkles className="size-4" />}
              label="技能市场"
              onClick={() => setActiveModule("skills")}
            />
            <SidebarShortcut icon={<Activity className="size-4" />} label="运行轨迹" />
            <SidebarShortcut icon={<Inbox className="size-4" />} label="审批队列" />
          </SidebarSection>
          <button
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            type="button"
            onClick={() => openCreateTaskForm()}
          >
            <Plus className="size-4" />
            新建任务
          </button>
          <button
            className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-stone-50"
            type="button"
            onClick={resetDemoData}
          >
            <RotateCcw className="size-4" />
            重置演示数据
          </button>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#fbfaf7]">
          <ModuleNav activeModule={activeModule} onChange={setActiveModule} />
          <TopBar
            aiMemberCount={activeAiMembers.length}
            channel={activeChannel}
            onlineMemberCount={workspaceMembers.filter((member) => member.presence === "online").length}
            pendingCount={pendingApprovals.length}
          />
          {activeModule === "workspace" ? (
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
                <ChannelTimeline
                  approvals={approvals}
                  members={workspaceMembers}
                  messages={channelMessages}
                  tasks={workspaceTasks}
                  onConvertMessageToTask={convertMessageToTask}
                  onDecision={decideApproval}
                  onSelectTask={selectTask}
                />
                <Composer onSend={sendMessage} />
              </div>
              <TaskBoard
                groups={taskGroups}
                members={assignableMembers}
                selectedTaskId={selectedTask.id}
                taskCount={workspaceTasks.length}
                onSelectTask={selectTask}
              />
            </div>
          ) : activeModule === "ai-teammates" ? (
            <AITeammateManager
              activeMembers={activeAiMembers}
              archivedCount={workspaceMembers.filter((member) => member.kind === "ai" && member.archived).length}
              skillCatalog={crewlySkillCatalog}
              selectedMemberId={selectedMember.id}
              onArchiveMember={archiveMember}
              onCreateMember={openCreateMemberForm}
              onEditMember={openEditMemberForm}
              onSelectMember={setSelectedMemberId}
            />
          ) : (
            <SkillLibraryModule
              activeMembers={activeAiMembers}
              skillCatalog={skillCatalog}
              workspaceSkillIds={workspaceSkillIds}
              onInstallCrewlySkill={installCrewlySkill}
              onSelectMember={setSelectedMemberId}
            />
          )}
        </section>

        <aside className="min-h-0 overflow-y-auto border-t border-stone-200 bg-[#f8f6f0] p-4 xl:border-l xl:border-t-0">
          <ContextPanel
            approval={taskApproval}
            member={selectedMember}
            skillCatalog={crewlySkillCatalog}
            onArchiveTask={archiveTask}
            onArchiveMember={archiveMember}
            onDecision={decideApproval}
            onEditMember={openEditMemberForm}
            onEditTask={openEditTaskForm}
            onInvokeSkill={invokeSkill}
            onTaskStatusAdvance={advanceTaskStatus}
            session={selectedSession}
            task={selectedTask}
          />
        </aside>
      </div>
      {taskFormOpen ? (
        <TaskFormDialog
          mode={taskFormMode}
          values={taskFormValues}
          members={assignableMembers}
          onChange={setTaskFormValues}
          onClose={() => setTaskFormOpen(false)}
          onSubmit={saveTaskForm}
        />
      ) : null}
      {channelFormOpen ? (
        <ChannelFormDialog
          values={channelFormValues}
          onChange={setChannelFormValues}
          onClose={() => setChannelFormOpen(false)}
          onSubmit={saveChannelForm}
        />
      ) : null}
      {memberFormOpen ? (
        <MemberFormDialog
          mode={memberFormMode}
          skillCatalog={crewlySkillCatalog}
          values={memberFormValues}
          onChange={setMemberFormValues}
          onClose={() => setMemberFormOpen(false)}
          onSubmit={saveMemberForm}
        />
      ) : null}
    </main>
  );
}

function WorkspaceHeader() {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-md bg-slate-950 text-lg font-semibold text-white">
          C
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{workspace.name}</h1>
          <p className="truncate text-xs text-slate-500">{workspace.description}</p>
        </div>
      </div>
    </div>
  );
}

function MetricStrip({ activeMemberCount }: Readonly<{ activeMemberCount: number }>) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <div className="rounded-md border border-stone-200 bg-white p-3">
        <p className="text-xs text-slate-500">活跃成员</p>
        <p className="mt-1 text-xl font-semibold">{activeMemberCount}</p>
      </div>
      <div className="rounded-md border border-stone-200 bg-white p-3">
        <p className="text-xs text-slate-500">工作状态</p>
        <p className="mt-1 truncate text-sm font-medium">{workspace.health}</p>
      </div>
    </div>
  );
}

function SidebarSection({
  children,
  title,
}: Readonly<{
  children: React.ReactNode;
  title: string;
}>) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase text-slate-500">{title}</h2>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function SidebarShortcut({
  active = false,
  icon,
  label,
  onClick,
}: Readonly<{
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}>) {
  return (
    <button
      className={`flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm ${
        active ? "bg-white font-medium text-slate-950 shadow-sm" : "text-slate-700 hover:bg-white"
      }`}
      type="button"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function ModuleNav({
  activeModule,
  onChange,
}: Readonly<{
  activeModule: WorkspaceModule;
  onChange: (module: WorkspaceModule) => void;
}>) {
  return (
    <nav className="flex shrink-0 items-center gap-1 border-b border-stone-200 bg-[#15110d] px-5 pt-3 text-sm text-stone-400">
      <ModuleNavButton
        active={activeModule === "workspace"}
        icon={<MessageSquareText className="size-4" />}
        label="工作台"
        onClick={() => onChange("workspace")}
      />
      <ModuleNavButton
        active={activeModule === "ai-teammates"}
        icon={<Bot className="size-4" />}
        label="AI 成员"
        onClick={() => onChange("ai-teammates")}
      />
      <ModuleNavButton
        active={activeModule === "skills"}
        icon={<Sparkles className="size-4" />}
        label="技能市场"
        onClick={() => onChange("skills")}
      />
      <span className="ml-2 inline-flex items-center gap-1 rounded-md border border-amber-700/50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
        AI
      </span>
    </nav>
  );
}

function ModuleNavButton({
  active,
  icon,
  label,
  onClick,
}: Readonly<{
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      className={`inline-flex h-10 items-center gap-1.5 border-b-2 px-2 transition ${
        active ? "border-orange-500 text-white" : "border-transparent hover:text-stone-200"
      }`}
      type="button"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function TopBar({
  aiMemberCount,
  channel,
  onlineMemberCount,
  pendingCount,
}: Readonly<{
  aiMemberCount: number;
  channel: Channel;
  onlineMemberCount: number;
  pendingCount: number;
}>) {
  return (
    <header className="flex flex-col gap-3 border-b border-stone-200 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Hash className="size-4" />
          当前频道
        </div>
        <h2 className="truncate text-2xl font-semibold">{channel.name}</h2>
        <p className="truncate text-sm text-slate-500">{channel.topic}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge icon={<Users className="size-3.5" />} label={`${onlineMemberCount} 位成员在线`} />
        <Badge icon={<Bot className="size-3.5" />} label={`${aiMemberCount} 个 AI 成员`} />
        <Badge icon={<ShieldCheck className="size-3.5" />} label={`${pendingCount} 个待审批`} />
      </div>
    </header>
  );
}

function Badge({
  icon,
  label,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
}>) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50 px-2.5 text-xs font-medium text-slate-700">
      {icon}
      {label}
    </span>
  );
}

function AITeammateManager({
  activeMembers,
  archivedCount,
  onArchiveMember,
  onCreateMember,
  onEditMember,
  onSelectMember,
  selectedMemberId,
  skillCatalog,
}: Readonly<{
  activeMembers: Member[];
  archivedCount: number;
  onArchiveMember: (memberId: string) => void;
  onCreateMember: () => void;
  onEditMember: (member: Member) => void;
  onSelectMember: (memberId: string) => void;
  selectedMemberId: string;
  skillCatalog: SkillCatalogItem[];
}>) {
  const memoryEnabledCount = activeMembers.filter((member) => member.memoryConfig?.enabled).length;
  const installedSkillCount = activeMembers.reduce(
    (total, member) => total + (member.skillConfig?.installedSkills.filter((skill) => skill.enabled).length ?? 0),
    0,
  );

  return (
    <section className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Bot className="size-4" />
            独立管理模块
          </div>
          <h2 className="mt-1 text-2xl font-semibold">AI 成员管理</h2>
          <p className="mt-1 text-sm text-slate-500">集中维护成员身份、职责、模型配置和启用状态。</p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
          type="button"
          onClick={onCreateMember}
        >
          <Plus className="size-4" />
          新建 AI 成员
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TeammateStat label="可用成员" value={String(activeMembers.length)} />
        <TeammateStat label="启用记忆" value={String(memoryEnabledCount)} />
        <TeammateStat label="启用技能" value={String(installedSkillCount)} />
        <TeammateStat label="已停用" value={String(archivedCount)} />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {activeMembers.map((member) => {
          const config = member.modelConfig ?? defaultModelConfig;
          const memory = member.memoryConfig ?? defaultMemoryConfig;
          const skills = member.skillConfig ?? defaultSkillConfig;
          const enabledSkills = skills.installedSkills.filter((skill) => skill.enabled);

          return (
            <article
              key={member.id}
              className={`rounded-lg border bg-white p-4 shadow-sm ${
                member.id === selectedMemberId ? "border-slate-950" : "border-stone-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  className="flex min-w-0 items-center gap-3 text-left"
                  type="button"
                  onClick={() => onSelectMember(member.id)}
                >
                  <Avatar member={member} />
                  <span className="min-w-0">
                    <MemberName member={member} />
                    <span className="mt-1 block truncate text-sm text-slate-500">{member.role}</span>
                  </span>
                </button>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  {member.presence === "online" ? "在线" : member.presence === "busy" ? "忙碌" : "离开"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <InfoTile label="提供商" value={config.provider} />
                <InfoTile label="模型" value={config.model} />
                <InfoTile label="环境" value={config.environment} />
                <InfoTile label="密钥引用" value={config.apiKeyRef || "未配置"} />
                <InfoTile label="记忆" value={memory.enabled ? `${memory.scope} / ${memory.retentionDays}天` : "关闭"} />
                <InfoTile label="技能策略" value={skills.invocationMode} />
              </div>
              <div className="mt-3 rounded-md bg-stone-50 p-2 text-xs">
                <p className="text-slate-500">Base URL</p>
                <p className="mt-1 truncate font-medium">{config.baseUrl}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {config.capabilities.streaming ? <CapabilityPill label="流式输出" /> : null}
                {config.capabilities.functionCalling ? <CapabilityPill label="工具调用" /> : null}
                {config.capabilities.jsonMode ? <CapabilityPill label="JSON 模式" /> : null}
                {config.capabilities.imageInput ? <CapabilityPill label="图片输入" /> : null}
              </div>
              <div className="mt-3 rounded-md bg-stone-50 p-2 text-xs">
                <p className="text-slate-500">已启用技能</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {enabledSkills.length > 0 ? (
                    enabledSkills.map((skill) => (
                      <CapabilityPill key={skill.id} label={formatInstalledSkillLabel(skill, skillCatalog)} />
                    ))
                  ) : (
                    <span className="text-slate-500">暂无启用技能</span>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-stone-50"
                  type="button"
                  onClick={() => onEditMember(member)}
                >
                  <Edit3 className="size-4" />
                  编辑配置
                </button>
                <button
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-stone-50"
                  type="button"
                  onClick={() => onArchiveMember(member.id)}
                >
                  <Archive className="size-4" />
                  停用
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SkillLibraryModule({
  activeMembers,
  onInstallCrewlySkill,
  onSelectMember,
  skillCatalog,
  workspaceSkillIds,
}: Readonly<{
  activeMembers: Member[];
  onInstallCrewlySkill: (skillId: string) => void;
  onSelectMember: (memberId: string) => void;
  skillCatalog: SkillCatalogItem[];
  workspaceSkillIds: string[];
}>) {
  const [skillInstallOpen, setSkillInstallOpen] = useState(false);
  const installedSkillIdSet = useMemo(() => new Set(workspaceSkillIds), [workspaceSkillIds]);
  const crewlySkills = skillCatalog.filter((skill) => installedSkillIdSet.has(skill.id));
  const marketplaceSkills = skillCatalog.filter((skill) => !installedSkillIdSet.has(skill.id));
  const totalInstallations = activeMembers.reduce(
    (total, member) => total + (member.skillConfig?.installedSkills.filter((skill) => skill.enabled).length ?? 0),
    0,
  );

  return (
    <section className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Sparkles className="size-4" />
            技能市场
          </div>
          <h2 className="mt-1 text-2xl font-semibold">Crewly 技能市场</h2>
          <p className="mt-1 text-sm text-slate-500">从 Skill 市场安装技能到 Crewly，再由 AI 成员按需启用和调用。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
            type="button"
            onClick={() => setSkillInstallOpen(true)}
          >
            <Sparkles className="size-4" />
            从 Skill 市场安装
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TeammateStat label="Skill 市场" value={String(skillCatalog.length)} />
        <TeammateStat label="Crewly 已安装" value={String(crewlySkills.length)} />
        <TeammateStat label="待安装" value={String(marketplaceSkills.length)} />
        <TeammateStat label="成员启用次数" value={String(totalInstallations)} />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {crewlySkills.map((skill) => {
          const installedMembers = activeMembers.filter((member) => hasInstalledSkill(member, skill.id));

          return (
            <article key={skill.id} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{skill.name}</h3>
                    <SkillCategoryBadge category={skill.category} />
                    <SkillRiskBadge riskLevel={skill.riskLevel} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{skill.description}</p>
                </div>
                <span className="shrink-0 rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-slate-600">
                  Crewly 已安装
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                <InfoListTile label="权限" items={skill.permissions} />
                <InfoListTile label="适用场景" items={skill.useCases} />
              </div>

              <div className="mt-3 rounded-md bg-stone-50 p-2 text-xs">
                <p className="text-slate-500">已启用成员</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {installedMembers.length > 0 ? (
                    installedMembers.map((member) => (
                      <button
                        key={member.id}
                        className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-stone-100"
                        type="button"
                        onClick={() => onSelectMember(member.id)}
                      >
                        <Avatar member={member} small />
                        {member.name}
                      </button>
                    ))
                  ) : (
                    <span className="text-slate-500">暂无成员启用</span>
                  )}
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                成员启用入口在 AI 成员配置内，仅能选择已安装到 Crewly 的技能。
              </p>
            </article>
          );
        })}
      </div>
      {skillInstallOpen ? (
        <SkillMarketplaceInstallDialog
          installedSkillIds={workspaceSkillIds}
          skillCatalog={skillCatalog}
          onClose={() => setSkillInstallOpen(false)}
          onSubmit={(skillId) => {
            onInstallCrewlySkill(skillId);
            setSkillInstallOpen(false);
          }}
        />
      ) : null}
    </section>
  );
}

function TeammateStat({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function SkillMarketplaceInstallDialog({
  installedSkillIds,
  onClose,
  onSubmit,
  skillCatalog,
}: Readonly<{
  installedSkillIds: string[];
  onClose: () => void;
  onSubmit: (skillId: string) => void;
  skillCatalog: SkillCatalogItem[];
}>) {
  const installedSkillIdSet = useMemo(() => new Set(installedSkillIds), [installedSkillIds]);
  const installableSkills = skillCatalog.filter((skill) => !installedSkillIdSet.has(skill.id));
  const [skillId, setSkillId] = useState(installableSkills[0]?.id ?? "");
  const selectedSkill = skillCatalog.find((skill) => skill.id === skillId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (skillId) onSubmit(skillId);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <form className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl" onSubmit={handleSubmit}>
        <DialogHeader eyebrow="Skill 市场" title="安装到 Crewly 技能市场" onClose={onClose} />
        <TaskSelect
          label="选择 Skill"
          value={skillId}
          onChange={setSkillId}
        >
          {installableSkills.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.category} · {item.riskLevel}风险
            </option>
          ))}
        </TaskSelect>
        {selectedSkill ? (
          <div className="mt-3 rounded-md border border-stone-200 bg-stone-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <SkillCategoryBadge category={selectedSkill.category} />
              <SkillRiskBadge riskLevel={selectedSkill.riskLevel} />
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{selectedSkill.description}</p>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <InfoListTile label="权限" items={selectedSkill.permissions} />
              <InfoListTile label="适用场景" items={selectedSkill.useCases} />
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm text-slate-500">
            Skill 市场中的技能已全部安装到 Crewly。
          </div>
        )}
        <DialogActions submitLabel="安装到 Crewly" onClose={onClose} />
      </form>
    </div>
  );
}

function CapabilityPill({ label }: Readonly<{ label: string }>) {
  return (
    <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-slate-600">
      {label}
    </span>
  );
}

function SkillCategoryBadge({ category }: Readonly<{ category: SkillCategory }>) {
  return (
    <span className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700">
      {category}
    </span>
  );
}

function SkillRiskBadge({ riskLevel }: Readonly<{ riskLevel: SkillRiskLevel }>) {
  const className =
    riskLevel === "高"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : riskLevel === "中"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <span className={`rounded-md border px-2 py-1 text-xs font-medium ${className}`}>
      {riskLevel}风险
    </span>
  );
}

function InfoListTile({
  items,
  label,
}: Readonly<{
  items: string[];
  label: string;
}>) {
  return (
    <div className="rounded-md bg-stone-50 p-2">
      <p className="text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="rounded-md bg-white px-2 py-1 font-medium text-slate-600">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChannelTimeline({
  approvals,
  members,
  messages: channelMessages,
  tasks: workspaceTasks,
  onConvertMessageToTask,
  onDecision,
  onSelectTask,
}: Readonly<{
  approvals: Approval[];
  members: Member[];
  messages: Message[];
  tasks: Task[];
  onConvertMessageToTask: (message: Message) => void;
  onDecision: (id: string, status: ApprovalStatus) => void;
  onSelectTask: (task: Task) => void;
}>) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const latestMessageId = channelMessages.at(-1)?.id;

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    timeline.scrollTo({
      top: timeline.scrollHeight,
      behavior: "smooth",
    });
  }, [channelMessages.length, latestMessageId]);

  return (
    <div ref={timelineRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
      {channelMessages.map((message) => {
        const author = members.find((member) => member.id === message.authorId) ?? members[0];
        const linkedTask = workspaceTasks.find((task) => task.id === message.linkedTaskId);
        const linkedApproval = approvals.find((approval) => approval.id === message.linkedApprovalId);

        return (
          <article key={message.id} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex gap-3">
              <Avatar member={author} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <MemberName member={author} />
                  <span className="text-xs text-slate-500">{author.role}</span>
                  <span className="text-xs text-slate-400">{message.time}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{message.body}</p>
                {!message.linkedTaskId ? (
                  <button
                    className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-stone-50"
                    onClick={() => onConvertMessageToTask(message)}
                  >
                    <Plus className="size-3.5" />
                    转为任务
                  </button>
                ) : null}
                {linkedTask ? (
                  <button
                    className="mt-3 flex w-full items-start justify-between rounded-md border border-stone-200 bg-stone-50 p-3 text-left hover:border-slate-300 hover:bg-white"
                    onClick={() => onSelectTask(linkedTask)}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{linkedTask.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {linkedTask.summary}
                      </span>
                    </span>
                    <ChevronRight className="ml-3 size-4 shrink-0 text-slate-400" />
                  </button>
                ) : null}
                {linkedApproval ? (
                  <ApprovalCard approval={linkedApproval} compact onDecision={onDecision} />
                ) : null}
                {message.attachments && message.attachments.length > 0 ? (
                  <AttachmentGrid attachments={message.attachments} />
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Composer({ onSend }: Readonly<{ onSend: (body: string, attachments: Attachment[]) => void }>) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSend(value, attachments);
    setValue("");
    setAttachments([]);
    setAttachmentError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const nextAttachments: Attachment[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        errors.push(`${file.name} 超过 2MB`);
        continue;
      }

      nextAttachments.push(await readFileAttachment(file));
    }

    setAttachments((current) => [...current, ...nextAttachments]);
    setAttachmentError(errors.join("，"));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
  }

  return (
    <form className="mt-4 shrink-0 rounded-lg border border-stone-200 bg-white p-3 shadow-sm" onSubmit={handleSubmit}>
      {attachments.length > 0 ? (
        <div className="mb-3">
          <AttachmentGrid attachments={attachments} onRemove={removeAttachment} />
        </div>
      ) : null}
      {attachmentError ? <p className="mb-2 text-xs text-rose-600">{attachmentError}</p> : null}
      <div className="flex min-h-14 items-center gap-3 rounded-md bg-stone-50 px-3 text-sm text-slate-500">
        <MessageSquareText className="size-4 shrink-0" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          placeholder="写下需求、同步进展，或 @AI 成员分配任务"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <input
          ref={fileInputRef}
          className="hidden"
          multiple
          type="file"
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <button
          className="grid size-9 place-items-center rounded-md border border-stone-200 bg-white text-slate-600 hover:bg-stone-100"
          title="添加图片或文件"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="size-4" />
        </button>
        <button
          className="grid size-9 place-items-center rounded-md bg-slate-950 text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!value.trim() && attachments.length === 0}
          title="发送"
          type="submit"
        >
          <Send className="size-4" />
        </button>
      </div>
    </form>
  );
}

function TaskBoard({
  groups,
  members,
  onSelectTask,
  selectedTaskId,
  taskCount,
}: Readonly<{
  groups: { status: TaskStatus; items: Task[] }[];
  members: Member[];
  onSelectTask: (task: Task) => void;
  selectedTaskId: string;
  taskCount: number;
}>) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <h2 className="font-semibold">任务看板</h2>
        <span className="text-xs text-slate-500">{taskCount} 个任务</span>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.status}>
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>{statusLabel[group.status]}</span>
              <span>{group.items.length}</span>
            </div>
            <div className="space-y-2">
              {group.items.map((task) => {
                const assignee = members.find((member) => member.id === task.assigneeId) ?? members[0];
                return (
                  <button
                    key={task.id}
                    className={`w-full rounded-md border p-3 text-left transition ${
                      task.id === selectedTaskId
                        ? "border-slate-950 bg-slate-50"
                        : "border-stone-200 bg-stone-50 hover:bg-white"
                    }`}
                    onClick={() => onSelectTask(task)}
                  >
                    <span className="block text-sm font-medium">{task.title}</span>
                    <span className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="truncate">{task.label}</span>
                      <span>{task.due}</span>
                    </span>
                    <span className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <Avatar member={assignee} small />
                      <MemberName member={assignee} small />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContextPanel({
  approval,
  member,
  onArchiveMember,
  onArchiveTask,
  onDecision,
  onEditMember,
  onEditTask,
  onInvokeSkill,
  onTaskStatusAdvance,
  session,
  skillCatalog,
  task,
}: Readonly<{
  approval?: Approval;
  member: Member;
  onArchiveMember: (memberId: string) => void;
  onArchiveTask: (taskId: string) => void;
  onDecision: (id: string, status: ApprovalStatus) => void;
  onEditMember: (member: Member) => void;
  onEditTask: (task: Task) => void;
  onInvokeSkill: (member: Member, task: Task, session: AgentSession, skill: SkillCatalogItem) => void;
  onTaskStatusAdvance: (taskId: string) => void;
  session: AgentSession;
  skillCatalog: SkillCatalogItem[];
  task: Task;
}>) {
  const sessionTimelineRef = useRef<HTMLDivElement>(null);
  const latestSessionEventId = session.events.at(-1)?.id;

  useEffect(() => {
    const timeline = sessionTimelineRef.current;
    if (!timeline) return;

    timeline.scrollTo({
      top: timeline.scrollHeight,
      behavior: "smooth",
    });
  }, [session.id, session.events.length, latestSessionEventId]);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">当前任务</p>
            <h2 className="mt-1 text-xl font-semibold">{task.title}</h2>
          </div>
          <span className={`rounded-md border px-2 py-1 text-xs font-medium ${statusClass[task.status]}`}>
            {statusLabel[task.status]}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{task.summary}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <InfoTile label="优先级" value={task.priority} />
          <InfoTile label="标签" value={task.label} />
          <InfoTile label="截止" value={task.due} />
        </div>
        <button
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800"
          onClick={() => onTaskStatusAdvance(task.id)}
        >
          <ChevronRight className="size-4" />
          推进到{statusLabel[nextTaskStatus(task.status)]}
        </button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-stone-50"
            onClick={() => onEditTask(task)}
          >
            <Edit3 className="size-4" />
            编辑
          </button>
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-stone-50"
            onClick={() => onArchiveTask(task.id)}
          >
            <Archive className="size-4" />
            归档
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">AI 成员</h2>
          <Sparkles className="size-4 text-amber-600" />
        </div>
        <div className="flex items-center gap-3">
          <Avatar member={member} />
          <div className="min-w-0">
            <MemberName member={member} />
            <p className="truncate text-sm text-slate-500">{member.role}</p>
          </div>
        </div>
        {member.kind === "ai" ? <ModelConfigSummary config={member.modelConfig ?? defaultModelConfig} /> : null}
        {member.kind === "ai" ? (
          <TeammateRuntimeSummary
            memory={member.memoryConfig ?? defaultMemoryConfig}
            skillCatalog={skillCatalog}
            skills={member.skillConfig ?? defaultSkillConfig}
          />
        ) : null}
        {member.kind === "ai" ? (
          <SkillInvocationPanel
            member={member}
            session={session}
            skillCatalog={skillCatalog}
            task={task}
            onInvokeSkill={onInvokeSkill}
          />
        ) : null}
        {member.kind === "ai" ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-stone-50"
              onClick={() => onEditMember(member)}
            >
              <Edit3 className="size-4" />
              编辑配置
            </button>
            <button
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-stone-50"
              onClick={() => onArchiveMember(member.id)}
            >
              <Archive className="size-4" />
              停用
            </button>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Agent Session</p>
            <h2 className="font-semibold">{session.title}</h2>
          </div>
          <SessionStatusBadge session={session} />
        </div>
        <div ref={sessionTimelineRef} className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {session.events.map((event) => (
            <div key={event.id} className="flex gap-3">
              <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${eventTone[event.type]}`}>
                {eventIcon(event.type)}
              </span>
              <div className="min-w-0 flex-1 border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{event.title}</p>
                  <span className="text-xs text-slate-400">{event.time}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{event.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {approval ? <ApprovalCard approval={approval} onDecision={onDecision} /> : null}
    </div>
  );
}

function ApprovalCard({
  approval,
  compact = false,
  onDecision,
}: Readonly<{
  approval: Approval;
  compact?: boolean;
  onDecision: (id: string, status: ApprovalStatus) => void;
}>) {
  return (
    <section
      className={`mt-3 rounded-lg border p-4 ${approvalCardClass(approval.status)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">审批请求</p>
          <h3 className="mt-1 font-semibold">{approval.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{approval.summary}</p>
          {!compact ? <p className="mt-2 text-xs text-slate-500">{approval.risk}</p> : null}
        </div>
        <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700">
          {approvalLabel[approval.status]}
        </span>
      </div>
      {approval.status === "pending" ? (
        <div className="mt-3 flex gap-2">
          <button
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-slate-950 px-3 text-sm font-medium text-white"
            onClick={() => onDecision(approval.id, "approved")}
          >
            <Check className="size-4" />
            通过
          </button>
          <button
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-slate-700"
            onClick={() => onDecision(approval.id, "denied")}
          >
            <X className="size-4" />
            拒绝
          </button>
        </div>
      ) : null}
    </section>
  );
}

function TaskFormDialog({
  members,
  mode,
  onChange,
  onClose,
  onSubmit,
  values,
}: Readonly<{
  members: Member[];
  mode: TaskFormMode;
  onChange: (values: TaskFormState) => void;
  onClose: () => void;
  onSubmit: (values: TaskFormState) => void;
  values: TaskFormState;
}>) {
  function update<K extends keyof TaskFormState>(key: K, value: TaskFormState[K]) {
    onChange({
      ...values,
      [key]: value,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <form className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl" onSubmit={handleSubmit}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">任务</p>
            <h2 className="text-xl font-semibold">{mode === "create" ? "新建任务" : "编辑任务"}</h2>
          </div>
          <button
            className="grid size-8 place-items-center rounded-md border border-stone-200 text-slate-600 hover:bg-stone-50"
            type="button"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">标题</span>
            <input
              className="mt-1 h-10 w-full rounded-md border border-stone-300 px-3 text-sm outline-none focus:border-slate-950"
              placeholder="输入任务标题"
              required
              value={values.title}
              onChange={(event) => update("title", event.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">描述</span>
            <textarea
              className="mt-1 min-h-24 w-full resize-none rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
              placeholder="补充任务背景、目标或验收口径"
              value={values.summary}
              onChange={(event) => update("summary", event.target.value)}
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TaskSelect
              label="负责人"
              value={values.assigneeId}
              onChange={(value) => update("assigneeId", value)}
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · {member.role}
                </option>
              ))}
            </TaskSelect>
            <TaskSelect
              label="优先级"
              value={values.priority}
              onChange={(value) => update("priority", value as TaskPriority)}
            >
              <option value="高">高</option>
              <option value="中">中</option>
              <option value="低">低</option>
            </TaskSelect>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">标签</span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-stone-300 px-3 text-sm outline-none focus:border-slate-950"
                value={values.label}
                onChange={(event) => update("label", event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">截止</span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-stone-300 px-3 text-sm outline-none focus:border-slate-950"
                value={values.due}
                onChange={(event) => update("due", event.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-stone-50"
            type="button"
            onClick={onClose}
          >
            取消
          </button>
          <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-medium text-white" type="submit">
            {mode === "create" ? "创建任务" : "保存修改"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ChannelFormDialog({
  onChange,
  onClose,
  onSubmit,
  values,
}: Readonly<{
  onChange: (values: ChannelFormState) => void;
  onClose: () => void;
  onSubmit: (values: ChannelFormState) => void;
  values: ChannelFormState;
}>) {
  function update<K extends keyof ChannelFormState>(key: K, value: ChannelFormState[K]) {
    onChange({
      ...values,
      [key]: value,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <form className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl" onSubmit={handleSubmit}>
        <DialogHeader eyebrow="频道" title="新建频道" onClose={onClose} />
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">频道名称</span>
            <input
              className="mt-1 h-10 w-full rounded-md border border-stone-300 px-3 text-sm outline-none focus:border-slate-950"
              placeholder="例如：设计评审"
              required
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">主题</span>
            <textarea
              className="mt-1 min-h-24 w-full resize-none rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
              placeholder="说明这个频道用于同步什么内容"
              value={values.topic}
              onChange={(event) => update("topic", event.target.value)}
            />
          </label>
        </div>
        <DialogActions submitLabel="创建频道" onClose={onClose} />
      </form>
    </div>
  );
}

function MemberFormDialog({
  mode,
  onChange,
  onClose,
  onSubmit,
  skillCatalog,
  values,
}: Readonly<{
  mode: MemberFormMode;
  onChange: (values: MemberFormState) => void;
  onClose: () => void;
  onSubmit: (values: MemberFormState) => void;
  skillCatalog: SkillCatalogItem[];
  values: MemberFormState;
}>) {
  const selectedSkillIds = useMemo(() => parseInstalledSkills(values.installedSkillsText), [values.installedSkillsText]);
  const selectedSkillIdSet = useMemo(() => new Set(selectedSkillIds.map((skill) => skill.id)), [selectedSkillIds]);
  const customSkills = selectedSkillIds.filter((skill) => !skillCatalog.some((item) => item.id === skill.id));

  function update<K extends keyof MemberFormState>(key: K, value: MemberFormState[K]) {
    onChange({
      ...values,
      [key]: value,
    });
  }

  function toggleCatalogSkill(skill: SkillCatalogItem, checked: boolean) {
    const currentSkills = parseInstalledSkills(values.installedSkillsText);
    const nextSkills = checked
      ? mergeInstalledSkill(currentSkills, catalogItemToInstalledSkill(skill))
      : currentSkills.filter((item) => item.id !== skill.id);

    update("installedSkillsText", skillsToText(nextSkills));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <form className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded-lg bg-white p-5 shadow-xl" onSubmit={handleSubmit}>
        <DialogHeader eyebrow="AI 成员" title={mode === "create" ? "新建 AI 成员" : "编辑 AI 成员"} onClose={onClose} />
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">名称</span>
            <input
              className="mt-1 h-10 w-full rounded-md border border-stone-300 px-3 text-sm outline-none focus:border-slate-950"
              placeholder="例如：Researcher"
              required
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">职责</span>
            <textarea
              className="mt-1 min-h-24 w-full resize-none rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
              placeholder="例如：竞品研究、资料整理和结论提炼"
              value={values.role}
              onChange={(event) => update("role", event.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">头像字符</span>
            <input
              className="mt-1 h-10 w-full rounded-md border border-stone-300 px-3 text-sm outline-none focus:border-slate-950"
              maxLength={2}
              placeholder="默认使用名称首字"
              value={values.avatar}
              onChange={(event) => update("avatar", event.target.value)}
            />
          </label>
          <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">大模型配置</p>
                <p className="mt-1 text-xs text-slate-500">按真实接入字段配置，仅保存密钥引用名，不保存 API Key 明文。</p>
              </div>
              <Bot className="size-4 shrink-0 text-slate-500" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TaskSelect
                label="模型提供商"
                value={values.modelProvider}
                onChange={(value) => update("modelProvider", value as ModelProvider)}
              >
                {modelProviders.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </TaskSelect>
              <TaskSelect
                label="运行环境"
                value={values.environment}
                onChange={(value) => update("environment", value as ModelEnvironment)}
              >
                {modelEnvironments.map((environment) => (
                  <option key={environment} value={environment}>
                    {environment}
                  </option>
                ))}
              </TaskSelect>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">模型名称</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-slate-950"
                  placeholder="例如：gpt-5、deepseek-chat"
                  value={values.modelName}
                  onChange={(event) => update("modelName", event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Base URL</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-slate-950"
                  placeholder="例如：https://api.openai.com/v1"
                  value={values.baseUrl}
                  onChange={(event) => update("baseUrl", event.target.value)}
                />
              </label>
              <TaskSelect
                label="认证方式"
                value={values.authType}
                onChange={(value) => update("authType", value as ModelAuthType)}
              >
                {authTypes.map((authType) => (
                  <option key={authType} value={authType}>
                    {authType}
                  </option>
                ))}
              </TaskSelect>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">密钥引用名</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-slate-950"
                  placeholder="例如：OPENAI_API_KEY"
                  value={values.apiKeyRef}
                  onChange={(event) => update("apiKeyRef", event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">组织 ID</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-slate-950"
                  placeholder="可选"
                  value={values.organizationId}
                  onChange={(event) => update("organizationId", event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">项目 ID</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-slate-950"
                  placeholder="可选"
                  value={values.projectId}
                  onChange={(event) => update("projectId", event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Temperature</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-slate-950"
                  max="2"
                  min="0"
                  step="0.1"
                  type="number"
                  value={values.temperature}
                  onChange={(event) => update("temperature", event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">最大 Tokens</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-slate-950"
                  min="1"
                  step="1"
                  type="number"
                  value={values.maxTokens}
                  onChange={(event) => update("maxTokens", event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">超时秒数</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-slate-950"
                  min="1"
                  step="1"
                  type="number"
                  value={values.timeoutSeconds}
                  onChange={(event) => update("timeoutSeconds", event.target.value)}
                />
              </label>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <ModelCapabilityCheckbox
                checked={values.streaming}
                label="流式输出"
                onChange={(checked) => update("streaming", checked)}
              />
              <ModelCapabilityCheckbox
                checked={values.functionCalling}
                label="工具调用"
                onChange={(checked) => update("functionCalling", checked)}
              />
              <ModelCapabilityCheckbox
                checked={values.jsonMode}
                label="JSON 模式"
                onChange={(checked) => update("jsonMode", checked)}
              />
              <ModelCapabilityCheckbox
                checked={values.imageInput}
                label="图片输入"
                onChange={(checked) => update("imageInput", checked)}
              />
            </div>
            <label className="mt-3 block">
              <span className="text-sm font-medium text-slate-700">接入说明</span>
              <textarea
                className="mt-1 min-h-20 w-full resize-none rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
                placeholder="例如：通过后端安全代理调用，密钥由服务端托管"
                value={values.endpointHint}
                onChange={(event) => update("endpointHint", event.target.value)}
              />
            </label>
          </div>
          <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">独立记忆</p>
                <p className="mt-1 text-xs text-slate-500">每个 AI 成员单独保存记忆范围和保留策略。</p>
              </div>
              <CircleDot className="size-4 shrink-0 text-slate-500" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ModelCapabilityCheckbox
                checked={values.memoryEnabled}
                label="启用记忆"
                onChange={(checked) => update("memoryEnabled", checked)}
              />
              <TaskSelect
                label="记忆范围"
                value={values.memoryScope}
                onChange={(value) => update("memoryScope", value as MemoryScope)}
              >
                {memoryScopes.map((scope) => (
                  <option key={scope} value={scope}>
                    {scope}
                  </option>
                ))}
              </TaskSelect>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">保留天数</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-slate-950"
                  min="1"
                  step="1"
                  type="number"
                  value={values.memoryRetentionDays}
                  onChange={(event) => update("memoryRetentionDays", event.target.value)}
                />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="text-sm font-medium text-slate-700">记忆说明</span>
              <textarea
                className="mt-1 min-h-20 w-full resize-none rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
                placeholder="说明该 AI 成员应该记住什么"
                value={values.memoryNotes}
                onChange={(event) => update("memoryNotes", event.target.value)}
              />
            </label>
          </div>
          <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">独立技能</p>
                <p className="mt-1 text-xs text-slate-500">每个 AI 成员从 Crewly 已安装技能中独立启用，并维护调用策略。</p>
              </div>
              <Sparkles className="size-4 shrink-0 text-slate-500" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TaskSelect
                label="调用策略"
                value={values.skillInvocationMode}
                onChange={(value) => update("skillInvocationMode", value as SkillInvocationMode)}
              >
                {skillInvocationModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </TaskSelect>
              <ModelCapabilityCheckbox
                checked={values.skillApprovalRequired}
                label="外部动作需审批"
                onChange={(checked) => update("skillApprovalRequired", checked)}
              />
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium text-slate-700">启用 Crewly 技能</p>
              <div className="mt-2 grid grid-cols-1 gap-2">
                {skillCatalog.map((skill) => (
                  <SkillInstallCheckbox
                    key={skill.id}
                    checked={selectedSkillIdSet.has(skill.id)}
                    skill={skill}
                    onChange={(checked) => toggleCatalogSkill(skill, checked)}
                  />
                ))}
              </div>
              {customSkills.length > 0 ? (
                <div className="mt-3 rounded-md border border-stone-200 bg-white p-2 text-xs">
                  <p className="text-slate-500">自定义技能</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {customSkills.map((skill) => (
                      <CapabilityPill key={skill.id} label={skill.name} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <DialogActions submitLabel={mode === "create" ? "创建 AI 成员" : "保存配置"} onClose={onClose} />
      </form>
    </div>
  );
}

function DialogHeader({
  eyebrow,
  onClose,
  title,
}: Readonly<{
  eyebrow: string;
  onClose: () => void;
  title: string;
}>) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-slate-500">{eyebrow}</p>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <button
        className="grid size-8 place-items-center rounded-md border border-stone-200 text-slate-600 hover:bg-stone-50"
        type="button"
        onClick={onClose}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function DialogActions({
  onClose,
  submitLabel,
}: Readonly<{
  onClose: () => void;
  submitLabel: string;
}>) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button
        className="h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-stone-50"
        type="button"
        onClick={onClose}
      >
        取消
      </button>
      <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-medium text-white" type="submit">
        {submitLabel}
      </button>
    </div>
  );
}

function ModelCapabilityCheckbox({
  checked,
  label,
  onChange,
}: Readonly<{
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}>) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-slate-700">
      <input
        checked={checked}
        className="size-4 accent-slate-950"
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function SkillInstallCheckbox({
  checked,
  onChange,
  skill,
}: Readonly<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  skill: SkillCatalogItem;
}>) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-stone-200 bg-white p-3 text-slate-700">
      <input
        checked={checked}
        className="mt-1 size-4 shrink-0 accent-slate-950"
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-800">{skill.name}</span>
          <SkillCategoryBadge category={skill.category} />
          <SkillRiskBadge riskLevel={skill.riskLevel} />
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{skill.description}</span>
        <span className="mt-2 flex flex-wrap gap-1.5">
          {skill.permissions.map((permission) => (
            <span key={permission} className="rounded-md bg-stone-100 px-2 py-1 text-[11px] font-medium text-slate-600">
              {permission}
            </span>
          ))}
        </span>
      </span>
    </label>
  );
}

function TaskSelect({
  children,
  label,
  onChange,
  value,
}: Readonly<{
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-slate-950"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

function AttachmentGrid({
  attachments,
  onRemove,
}: Readonly<{
  attachments: Attachment[];
  onRemove?: (id: string) => void;
}>) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {attachments.map((attachment) =>
        isImageAttachment(attachment) ? (
          <div key={attachment.id} className="relative overflow-hidden rounded-md border border-stone-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={attachment.name}
              className="h-32 w-full object-cover"
              src={attachment.url}
            />
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs text-slate-600">
              <span className="flex min-w-0 items-center gap-1">
                <ImageIcon className="size-3.5 shrink-0" />
                <span className="truncate">{attachment.name}</span>
              </span>
              <span className="shrink-0">{formatFileSize(attachment.size)}</span>
            </div>
            {onRemove ? <RemoveAttachmentButton id={attachment.id} onRemove={onRemove} /> : null}
          </div>
        ) : (
          <div
            key={attachment.id}
            className="relative flex items-center gap-3 rounded-md border border-stone-200 bg-white p-3"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-stone-100 text-slate-600">
              <FileText className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <a
                className="block truncate text-sm font-medium text-slate-800 hover:underline"
                download={attachment.name}
                href={attachment.url}
              >
                {attachment.name}
              </a>
              <p className="mt-1 text-xs text-slate-500">
                {attachment.type || "未知类型"} · {formatFileSize(attachment.size)}
              </p>
            </div>
            {onRemove ? <RemoveAttachmentButton id={attachment.id} onRemove={onRemove} /> : null}
          </div>
        ),
      )}
    </div>
  );
}

function RemoveAttachmentButton({
  id,
  onRemove,
}: Readonly<{
  id: string;
  onRemove: (id: string) => void;
}>) {
  return (
    <button
      className="absolute right-2 top-2 grid size-7 place-items-center rounded-md bg-white/90 text-slate-700 shadow-sm hover:bg-white"
      title="移除附件"
      type="button"
      onClick={() => onRemove(id)}
    >
      <X className="size-4" />
    </button>
  );
}

function InfoTile({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="rounded-md bg-stone-50 p-2">
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 truncate font-medium">{value}</p>
    </div>
  );
}

function ModelConfigSummary({ config }: Readonly<{ config: ModelConfig }>) {
  const capabilityLabels = [
    config.capabilities.streaming ? "流式输出" : null,
    config.capabilities.functionCalling ? "工具调用" : null,
    config.capabilities.jsonMode ? "JSON 模式" : null,
    config.capabilities.imageInput ? "图片输入" : null,
  ].filter(Boolean);

  return (
    <div className="mt-4 rounded-md border border-stone-200 bg-stone-50 p-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <InfoTile label="模型提供商" value={config.provider} />
        <InfoTile label="模型名称" value={config.model} />
        <InfoTile label="运行环境" value={config.environment} />
        <InfoTile label="认证方式" value={config.authType} />
        <InfoTile label="密钥引用" value={config.apiKeyRef || "未配置"} />
        <InfoTile label="超时" value={`${config.timeoutSeconds}s`} />
      </div>
      <div className="mt-3 rounded-md bg-white p-2 text-xs">
        <p className="text-slate-500">Base URL</p>
        <p className="mt-1 truncate font-medium text-slate-700">{config.baseUrl}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <InfoTile label="Temperature" value={String(config.temperature)} />
        <InfoTile label="最大 Tokens" value={String(config.maxTokens)} />
      </div>
      {config.organizationId || config.projectId ? (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {config.organizationId ? <InfoTile label="组织 ID" value={config.organizationId} /> : null}
          {config.projectId ? <InfoTile label="项目 ID" value={config.projectId} /> : null}
        </div>
      ) : null}
      {capabilityLabels.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {capabilityLabels.map((label) => (
            <span key={label} className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600">
              {label}
            </span>
          ))}
        </div>
      ) : null}
      {config.endpointHint ? (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          {config.endpointHint}
        </p>
      ) : null}
    </div>
  );
}

function TeammateRuntimeSummary({
  memory,
  skillCatalog,
  skills,
}: Readonly<{
  memory: typeof defaultMemoryConfig;
  skillCatalog: SkillCatalogItem[];
  skills: typeof defaultSkillConfig;
}>) {
  const enabledSkills = skills.installedSkills.filter((skill) => skill.enabled);

  return (
    <div className="mt-3 rounded-md border border-stone-200 bg-stone-50 p-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <InfoTile label="独立记忆" value={memory.enabled ? memory.scope : "关闭"} />
        <InfoTile label="保留" value={memory.enabled ? `${memory.retentionDays}天` : "不保留"} />
        <InfoTile label="技能数" value={String(enabledSkills.length)} />
        <InfoTile label="调用策略" value={skills.invocationMode} />
      </div>
      {memory.notes ? <p className="mt-3 text-xs leading-5 text-slate-500">{memory.notes}</p> : null}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {enabledSkills.length > 0 ? (
          enabledSkills.map((skill) => {
            const catalogSkill = findCatalogSkill(skill.id, skillCatalog);

            return catalogSkill ? (
              <span
                key={skill.id}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600"
              >
                {catalogSkill.category} / {catalogSkill.name}
              </span>
            ) : (
              <CapabilityPill key={skill.id} label={skill.name} />
            );
          })
        ) : (
          <span className="text-xs text-slate-500">暂无启用技能</span>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {skills.requireApprovalForExternalActions ? "外部动作需要审批" : "外部动作按策略直接处理"}
      </p>
    </div>
  );
}

function SkillInvocationPanel({
  member,
  onInvokeSkill,
  session,
  skillCatalog,
  task,
}: Readonly<{
  member: Member;
  onInvokeSkill: (member: Member, task: Task, session: AgentSession, skill: SkillCatalogItem) => void;
  session: AgentSession;
  skillCatalog: SkillCatalogItem[];
  task: Task;
}>) {
  const installedSkills = (member.skillConfig?.installedSkills ?? defaultSkillConfig.installedSkills)
    .filter((skill) => skill.enabled)
    .map((skill) => findCatalogSkill(skill.id, skillCatalog))
    .filter((skill): skill is SkillCatalogItem => Boolean(skill));

  return (
    <div className="mt-3 rounded-md border border-stone-200 bg-stone-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">可调用技能</p>
          <p className="mt-1 text-xs text-slate-500">调用结果会写入当前 Agent Session。</p>
        </div>
        <Sparkles className="size-4 shrink-0 text-slate-500" />
      </div>
      <div className="mt-3 space-y-2">
        {installedSkills.length > 0 ? (
          installedSkills.map((skill) => {
            const skillConfig = member.skillConfig ?? defaultSkillConfig;
            const approvalRequired =
              skill.riskLevel === "高" || skillConfig.requireApprovalForExternalActions;

            return (
              <button
                key={skill.id}
                className="flex w-full items-start justify-between gap-3 rounded-md border border-stone-200 bg-white p-3 text-left hover:border-slate-300 hover:bg-stone-50"
                type="button"
                onClick={() => onInvokeSkill(member, task, session, skill)}
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-800">{skill.name}</span>
                    <SkillCategoryBadge category={skill.category} />
                    <SkillRiskBadge riskLevel={skill.riskLevel} />
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{skill.description}</span>
                </span>
                <span className="shrink-0 rounded-md bg-stone-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                  {approvalRequired ? "需审批" : "直接模拟"}
                </span>
              </button>
            );
          })
        ) : (
          <p className="text-xs text-slate-500">该成员还没有可调用技能。</p>
        )}
      </div>
    </div>
  );
}

function SessionStatusBadge({ session }: Readonly<{ session: AgentSession }>) {
  const label =
    session.status === "running"
      ? "运行中"
      : session.status === "waiting_approval"
        ? "等审批"
        : "已完成";

  return (
    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
      {label}
    </span>
  );
}

function Avatar({
  member,
  small = false,
}: Readonly<{
  member: Member;
  small?: boolean;
}>) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-md font-semibold ${
        small ? "size-5 text-[10px]" : "size-9 text-sm"
      } ${member.kind === "ai" ? "bg-slate-950 text-white" : "bg-emerald-700 text-white"}`}
    >
      {member.avatar}
    </span>
  );
}

function MemberName({
  member,
  small = false,
}: Readonly<{
  member: Member;
  small?: boolean;
}>) {
  return (
    <span className={`flex min-w-0 items-center gap-1.5 ${small ? "text-xs" : "text-sm"}`}>
      <span className="truncate font-medium">{member.name}</span>
      {member.kind === "ai" ? <MemberKindBadge /> : null}
    </span>
  );
}

function MemberKindBadge() {
  return (
    <span className="shrink-0 rounded-md border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-cyan-700">
      AI
    </span>
  );
}

function eventIcon(type: RuntimeEventType) {
  if (type === "thinking") return <CircleDot className="size-3.5" />;
  if (type === "tool") return <Activity className="size-3.5" />;
  if (type === "result") return <Check className="size-3.5" />;
  if (type === "approval") return <ShieldCheck className="size-3.5" />;
  return <Minus className="size-3.5" />;
}

function readFileAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      resolve({
        id: `attachment-${Date.now()}-${crypto.randomUUID()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: String(reader.result),
      });
    });

    reader.addEventListener("error", () => {
      reject(reader.error);
    });

    reader.readAsDataURL(file);
  });
}

function isImageAttachment(attachment: Attachment) {
  return attachment.type.startsWith("image/");
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function nextTaskStatus(status: TaskStatus): TaskStatus {
  const currentIndex = taskStatusOrder.indexOf(status);
  return taskStatusOrder[(currentIndex + 1) % taskStatusOrder.length];
}

function formatNow() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function normalizeAvatar(avatar: string, name: string) {
  return (avatar.trim() || name.trim().slice(0, 1) || "A").slice(0, 2).toUpperCase();
}

function memberToFormState(member: Member): MemberFormState {
  const config = normalizeModelConfig(member.modelConfig);

  return {
    apiKeyRef: config.apiKeyRef,
    avatar: member.avatar,
    authType: config.authType,
    baseUrl: config.baseUrl,
    endpointHint: config.endpointHint ?? "",
    environment: config.environment,
    functionCalling: config.capabilities.functionCalling,
    imageInput: config.capabilities.imageInput,
    installedSkillsText: skillsToText(member.skillConfig?.installedSkills ?? defaultSkillConfig.installedSkills),
    jsonMode: config.capabilities.jsonMode,
    maxTokens: String(config.maxTokens),
    memoryEnabled: member.memoryConfig?.enabled ?? defaultMemoryConfig.enabled,
    memoryNotes: member.memoryConfig?.notes ?? defaultMemoryConfig.notes,
    memoryRetentionDays: String(member.memoryConfig?.retentionDays ?? defaultMemoryConfig.retentionDays),
    memoryScope: member.memoryConfig?.scope ?? defaultMemoryConfig.scope,
    modelName: config.model,
    modelProvider: config.provider,
    name: member.name,
    organizationId: config.organizationId ?? "",
    projectId: config.projectId ?? "",
    role: member.role,
    skillApprovalRequired:
      member.skillConfig?.requireApprovalForExternalActions ?? defaultSkillConfig.requireApprovalForExternalActions,
    skillInvocationMode: member.skillConfig?.invocationMode ?? defaultSkillConfig.invocationMode,
    streaming: config.capabilities.streaming,
    temperature: String(config.temperature),
    timeoutSeconds: String(config.timeoutSeconds),
  };
}

function createModelConfig(values: MemberFormState): ModelConfig {
  const organizationId = values.organizationId.trim();
  const projectId = values.projectId.trim();

  return {
    apiKeyRef: values.apiKeyRef.trim() || defaultModelConfig.apiKeyRef,
    authType: values.authType,
    baseUrl: values.baseUrl.trim() || defaultModelConfig.baseUrl,
    capabilities: {
      functionCalling: values.functionCalling,
      imageInput: values.imageInput,
      jsonMode: values.jsonMode,
      streaming: values.streaming,
    },
    endpointHint: values.endpointHint.trim() || defaultModelConfig.endpointHint,
    environment: values.environment,
    maxTokens: parsePositiveInteger(values.maxTokens, defaultModelConfig.maxTokens),
    model: values.modelName.trim() || defaultModelConfig.model,
    organizationId: organizationId || undefined,
    projectId: projectId || undefined,
    provider: values.modelProvider,
    temperature: parseBoundedNumber(values.temperature, defaultModelConfig.temperature, 0, 2),
    timeoutSeconds: parsePositiveInteger(values.timeoutSeconds, defaultModelConfig.timeoutSeconds),
  };
}

function createMemoryConfig(values: MemberFormState) {
  return {
    enabled: values.memoryEnabled,
    notes: values.memoryNotes.trim() || defaultMemoryConfig.notes,
    retentionDays: parsePositiveInteger(values.memoryRetentionDays, defaultMemoryConfig.retentionDays),
    scope: values.memoryScope,
  };
}

function createSkillConfig(values: MemberFormState) {
  return {
    installedSkills: parseInstalledSkills(values.installedSkillsText),
    invocationMode: values.skillInvocationMode,
    requireApprovalForExternalActions: values.skillApprovalRequired,
  };
}

function normalizeModelConfig(config?: Partial<ModelConfig>): ModelConfig {
  return {
    ...defaultModelConfig,
    ...config,
    capabilities: {
      ...defaultModelConfig.capabilities,
      ...config?.capabilities,
    },
  };
}

function normalizeMemoryConfig(config?: Partial<typeof defaultMemoryConfig>) {
  return {
    ...defaultMemoryConfig,
    ...config,
  };
}

function normalizeSkillConfig(config?: Partial<typeof defaultSkillConfig>) {
  return {
    ...defaultSkillConfig,
    ...config,
    installedSkills: config?.installedSkills ?? defaultSkillConfig.installedSkills,
  };
}

function parseInstalledSkills(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [idPart, namePart, descriptionPart] = line.split("|").map((part) => part.trim());
      const name = namePart || idPart;

      return {
        id: slugifySkillId(idPart || name),
        name,
        description: descriptionPart || "自定义技能",
        enabled: true,
      };
    });
}

function skillsToText(skills: typeof defaultSkillConfig.installedSkills) {
  return skills.map((skill) => `${skill.id} | ${skill.name} | ${skill.description}`).join("\n");
}

function catalogItemToInstalledSkill(skill: SkillCatalogItem) {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    enabled: true,
  };
}

function mergeInstalledSkill(skills: typeof defaultSkillConfig.installedSkills, nextSkill: typeof defaultSkillConfig.installedSkills[number]) {
  if (skills.some((skill) => skill.id === nextSkill.id)) {
    return skills.map((skill) => (skill.id === nextSkill.id ? { ...skill, ...nextSkill, enabled: true } : skill));
  }

  return [...skills, nextSkill];
}

function findCatalogSkill(skillId: string, catalog: SkillCatalogItem[]) {
  return catalog.find((skill) => skill.id === skillId);
}

function hasInstalledSkill(member: Member, skillId: string) {
  const installedSkills = member.skillConfig?.installedSkills ?? (member.kind === "ai" ? defaultSkillConfig.installedSkills : []);

  return installedSkills.some((skill) => skill.id === skillId && skill.enabled);
}

function formatInstalledSkillLabel(skill: typeof defaultSkillConfig.installedSkills[number], catalog: SkillCatalogItem[]) {
  const catalogSkill = findCatalogSkill(skill.id, catalog);
  return catalogSkill ? `${catalogSkill.category} / ${catalogSkill.name}` : skill.name;
}

function getSkillApprovalReason(skill: SkillCatalogItem, requireApprovalForExternalActions: boolean) {
  if (skill.riskLevel === "高" && requireApprovalForExternalActions) {
    return "高风险技能且成员策略要求外部动作审批";
  }
  if (skill.riskLevel === "高") return "高风险技能";
  if (requireApprovalForExternalActions) return "成员策略要求外部动作审批";
  return "无需审批";
}

function createSkillResultSummary(skill: SkillCatalogItem, task: Task) {
  const useCase = skill.useCases[0] ?? "任务推进";

  return `已基于任务「${task.title}」完成一次「${skill.name}」模拟调用，输出方向：${useCase}。`;
}

function slugifySkillId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "") || `skill-${Date.now()}`;
}

function parsePositiveInteger(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBoundedNumber(value: string, fallback: number, min: number, max: number) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function getDefaultAssigneeId(members: Member[]) {
  return members.find((member) => member.id === "builder")?.id ?? members[0]?.id ?? "builder";
}

function approvalCardClass(status: ApprovalStatus) {
  if (status === "pending") return "border-amber-200 bg-amber-50";
  if (status === "denied") return "border-rose-200 bg-rose-50";
  return "border-emerald-200 bg-emerald-50";
}

function readInitialWorkspaceState(): PersistedWorkspaceState {
  if (typeof window === "undefined") return initialWorkspaceState;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeWorkspaceState(JSON.parse(stored) as Partial<PersistedWorkspaceState>) : initialWorkspaceState;
  } catch {
    return initialWorkspaceState;
  }
}

function normalizeWorkspaceState(state: Partial<PersistedWorkspaceState>): PersistedWorkspaceState {
  return {
    approvals: state.approvals ?? approvalSeed,
    channels: state.channels ?? channelSeed,
    members: normalizeMembers(state.members ?? memberSeed),
    messages: state.messages ?? messages,
    sessions: state.sessions ?? sessions,
    tasks: state.tasks ?? tasks,
    workspaceSkillIds: normalizeWorkspaceSkillIds(state.workspaceSkillIds),
  };
}

function normalizeWorkspaceSkillIds(skillIds?: string[]) {
  const catalogSkillIds = new Set(skillCatalog.map((skill) => skill.id));
  const normalizedSkillIds = (skillIds ?? initialWorkspaceState.workspaceSkillIds).filter((skillId) =>
    catalogSkillIds.has(skillId),
  );

  return normalizedSkillIds.length > 0 ? Array.from(new Set(normalizedSkillIds)) : initialWorkspaceState.workspaceSkillIds;
}

function normalizeMembers(items: Member[]) {
  return items.map((member) =>
    member.kind === "ai"
      ? {
          ...member,
          memoryConfig: normalizeMemoryConfig(member.memoryConfig),
          modelConfig: normalizeModelConfig(member.modelConfig),
          skillConfig: normalizeSkillConfig(member.skillConfig),
        }
      : member,
  );
}
