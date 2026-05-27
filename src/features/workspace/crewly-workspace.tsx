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
  channels,
  members,
  messages,
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
  RuntimeEventType,
  SessionStatus,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";

type PersistedWorkspaceState = {
  approvals: Approval[];
  messages: Message[];
  sessions: AgentSession[];
  tasks: Task[];
};

type TaskFormMode = "create" | "edit";

type TaskFormState = {
  assigneeId: string;
  due: string;
  label: string;
  priority: TaskPriority;
  summary: string;
  title: string;
};

const STORAGE_KEY = "crewly.workspace.v1";
const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024;
const taskStatusOrder: TaskStatus[] = ["todo", "doing", "review", "done"];

const initialWorkspaceState: PersistedWorkspaceState = {
  approvals: approvalSeed,
  messages,
  sessions,
  tasks,
};

const emptyTaskForm: TaskFormState = {
  assigneeId: "builder",
  due: "今天",
  label: "需求",
  priority: "中",
  summary: "",
  title: "",
};

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
  const [activeChannelId, setActiveChannelId] = useState(channels[0].id);
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0].id);
  const [selectedMemberId, setSelectedMemberId] = useState("builder");
  const [taskFormMode, setTaskFormMode] = useState<TaskFormMode>("create");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [taskFormTaskId, setTaskFormTaskId] = useState<string | null>(null);
  const [taskFormValues, setTaskFormValues] = useState<TaskFormState>(emptyTaskForm);
  const [workspaceState, setWorkspaceState] = useState(readInitialWorkspaceState);

  const { approvals, messages: workspaceMessages, sessions: workspaceSessions, tasks: workspaceTasks } =
    workspaceState;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaceState));
    } catch {
      // Demo persistence should not block the workspace when storage is unavailable.
    }
  }, [workspaceState]);

  const activeChannel = channels.find((channel) => channel.id === activeChannelId) ?? channels[0];
  const visibleTasks = useMemo(() => workspaceTasks.filter((task) => !task.archived), [workspaceTasks]);
  const selectedTask = visibleTasks.find((task) => task.id === selectedTaskId) ?? visibleTasks[0] ?? workspaceTasks[0];
  const selectedSession =
    workspaceSessions.find((session) => session.id === selectedTask.sessionId) ?? workspaceSessions[0];
  const selectedMember =
    members.find((member) => member.id === selectedMemberId) ??
    members.find((member) => member.id === selectedTask.assigneeId) ??
    members[0];
  const channelMessages = workspaceMessages.filter((message) => message.channelId === activeChannel.id);
  const taskApproval = approvals.find((approval) => approval.taskId === selectedTask.id);
  const pendingApprovals = approvals.filter((approval) => approval.status === "pending");

  const taskGroups = useMemo(
    () =>
      (["todo", "doing", "review", "done"] as TaskStatus[]).map((status) => ({
        status,
        items: visibleTasks.filter((task) => task.status === status),
      })),
    [visibleTasks],
  );

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
          : "相关任务已回到进行中，需要 AI 队友根据反馈继续修正。";

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
      assigneeId: selectedMember.kind === "ai" ? selectedMember.id : "builder",
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
    setActiveChannelId(channels[0].id);
  }

  return (
    <main className="h-dvh overflow-hidden bg-[#f4f1ea] text-slate-950">
      <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="min-h-0 overflow-y-auto border-b border-stone-200 bg-[#f8f6f0] px-4 py-4 xl:border-b-0 xl:border-r">
          <WorkspaceHeader />
          <MetricStrip />
          <SidebarSection title="频道">
            {channels.map((channel) => (
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
          </SidebarSection>
          <SidebarSection title="AI 队友">
            {members
              .filter((member) => member.kind === "ai")
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
                    <span className="block truncate text-sm font-medium">{member.name}</span>
                    <span className="block truncate text-xs text-slate-500">{member.role}</span>
                  </span>
                </button>
              ))}
          </SidebarSection>
          <SidebarSection title="快捷入口">
            <SidebarShortcut icon={<LayoutDashboard className="size-4" />} label="任务看板" />
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
          <TopBar channel={activeChannel} pendingCount={pendingApprovals.length} />
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
              <ChannelTimeline
                approvals={approvals}
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
              selectedTaskId={selectedTask.id}
              taskCount={workspaceTasks.length}
              onSelectTask={selectTask}
            />
          </div>
        </section>

        <aside className="min-h-0 overflow-y-auto border-t border-stone-200 bg-[#f8f6f0] p-4 xl:border-l xl:border-t-0">
          <ContextPanel
            approval={taskApproval}
            member={selectedMember}
            onArchiveTask={archiveTask}
            onDecision={decideApproval}
            onEditTask={openEditTaskForm}
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
          onChange={setTaskFormValues}
          onClose={() => setTaskFormOpen(false)}
          onSubmit={saveTaskForm}
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

function MetricStrip() {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <div className="rounded-md border border-stone-200 bg-white p-3">
        <p className="text-xs text-slate-500">活跃成员</p>
        <p className="mt-1 text-xl font-semibold">{workspace.activeMembers}</p>
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
  icon,
  label,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
}>) {
  return (
    <button className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm text-slate-700 hover:bg-white">
      {icon}
      {label}
    </button>
  );
}

function TopBar({
  channel,
  pendingCount,
}: Readonly<{
  channel: Channel;
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
        <Badge icon={<Users className="size-3.5" />} label="5 位成员在线" />
        <Badge icon={<Bot className="size-3.5" />} label="3 个 AI 队友" />
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

function ChannelTimeline({
  approvals,
  messages: channelMessages,
  tasks: workspaceTasks,
  onConvertMessageToTask,
  onDecision,
  onSelectTask,
}: Readonly<{
  approvals: Approval[];
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
                  <h3 className="font-medium">{author.name}</h3>
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
          placeholder="写下需求、同步进展，或 @AI 队友分配任务"
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
  onSelectTask,
  selectedTaskId,
  taskCount,
}: Readonly<{
  groups: { status: TaskStatus; items: Task[] }[];
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
                      {assignee.name}
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
  onArchiveTask,
  onDecision,
  onEditTask,
  onTaskStatusAdvance,
  session,
  task,
}: Readonly<{
  approval?: Approval;
  member: Member;
  onArchiveTask: (taskId: string) => void;
  onDecision: (id: string, status: ApprovalStatus) => void;
  onEditTask: (task: Task) => void;
  onTaskStatusAdvance: (taskId: string) => void;
  session: AgentSession;
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
          <h2 className="font-semibold">AI 队友</h2>
          <Sparkles className="size-4 text-amber-600" />
        </div>
        <div className="flex items-center gap-3">
          <Avatar member={member} />
          <div className="min-w-0">
            <p className="font-medium">{member.name}</p>
            <p className="truncate text-sm text-slate-500">{member.role}</p>
          </div>
        </div>
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
  mode,
  onChange,
  onClose,
  onSubmit,
  values,
}: Readonly<{
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

function approvalCardClass(status: ApprovalStatus) {
  if (status === "pending") return "border-amber-200 bg-amber-50";
  if (status === "denied") return "border-rose-200 bg-rose-50";
  return "border-emerald-200 bg-emerald-50";
}

function readInitialWorkspaceState(): PersistedWorkspaceState {
  if (typeof window === "undefined") return initialWorkspaceState;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as PersistedWorkspaceState) : initialWorkspaceState;
  } catch {
    return initialWorkspaceState;
  }
}
