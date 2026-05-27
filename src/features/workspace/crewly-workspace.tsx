"use client";

import {
  Activity,
  Bot,
  Check,
  ChevronRight,
  CircleDot,
  Hash,
  Inbox,
  LayoutDashboard,
  MessageSquareText,
  Minus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

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
  Channel,
  Member,
  Message,
  RuntimeEventType,
  SessionStatus,
  Task,
  TaskStatus,
} from "@/lib/types";

type PersistedWorkspaceState = {
  approvals: Approval[];
  messages: Message[];
  sessions: AgentSession[];
  tasks: Task[];
};

const STORAGE_KEY = "crewly.workspace.v1";
const taskStatusOrder: TaskStatus[] = ["todo", "doing", "review", "done"];

const initialWorkspaceState: PersistedWorkspaceState = {
  approvals: approvalSeed,
  messages,
  sessions,
  tasks,
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
  const selectedTask = workspaceTasks.find((task) => task.id === selectedTaskId) ?? workspaceTasks[0];
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
        items: workspaceTasks.filter((task) => task.status === status),
      })),
    [workspaceTasks],
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

  function sendMessage(body: string) {
    const trimmed = body.trim();
    if (!trimmed) return;

    setWorkspaceState((current) => ({
      ...current,
      messages: [
        ...current.messages,
        {
          id: `message-${Date.now()}`,
          authorId: "lin",
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
    <main className="min-h-screen bg-[#f4f1ea] text-slate-950">
      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="border-b border-stone-200 bg-[#f8f6f0] px-4 py-4 xl:border-b-0 xl:border-r">
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
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-stone-50"
            onClick={resetDemoData}
          >
            <RotateCcw className="size-4" />
            重置演示数据
          </button>
        </aside>

        <section className="flex min-w-0 flex-col bg-[#fbfaf7]">
          <TopBar channel={activeChannel} pendingCount={pendingApprovals.length} />
          <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0">
              <ChannelTimeline
                approvals={approvals}
                messages={channelMessages}
                tasks={workspaceTasks}
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

        <aside className="border-t border-stone-200 bg-[#f8f6f0] p-4 xl:border-l xl:border-t-0">
          <ContextPanel
            approval={taskApproval}
            member={selectedMember}
            onDecision={decideApproval}
            onTaskStatusAdvance={advanceTaskStatus}
            session={selectedSession}
            task={selectedTask}
          />
        </aside>
      </div>
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
  onDecision,
  onSelectTask,
}: Readonly<{
  approvals: Approval[];
  messages: Message[];
  tasks: Task[];
  onDecision: (id: string, status: ApprovalStatus) => void;
  onSelectTask: (task: Task) => void;
}>) {
  return (
    <div className="space-y-3">
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
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Composer({ onSend }: Readonly<{ onSend: (body: string) => void }>) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSend(value);
    setValue("");
  }

  return (
    <form className="mt-4 rounded-lg border border-stone-200 bg-white p-3 shadow-sm" onSubmit={handleSubmit}>
      <div className="flex min-h-14 items-center gap-3 rounded-md bg-stone-50 px-3 text-sm text-slate-500">
        <MessageSquareText className="size-4 shrink-0" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          placeholder="写下需求、同步进展，或 @AI 队友分配任务"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <button
          className="grid size-9 place-items-center rounded-md bg-slate-950 text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!value.trim()}
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
    <section className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">任务看板</h2>
        <span className="text-xs text-slate-500">{taskCount} 个任务</span>
      </div>
      <div className="space-y-3">
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
  onDecision,
  onTaskStatusAdvance,
  session,
  task,
}: Readonly<{
  approval?: Approval;
  member: Member;
  onDecision: (id: string, status: ApprovalStatus) => void;
  onTaskStatusAdvance: (taskId: string) => void;
  session: AgentSession;
  task: Task;
}>) {
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
        <div className="space-y-3">
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
