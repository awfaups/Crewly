import { asc, desc, eq } from "drizzle-orm";
import type { FastifyPluginAsync, FastifyReply } from "fastify";

import type { CreateMessageInput, CreateTaskInput, DecideApprovalInput } from "../../shared/api-contracts";
import {
  agentSessions,
  approvals,
  channels,
  members,
  messages,
  runtimeEvents,
  skills,
  tasks,
  workspaces,
  workspaceSkillInstalls,
} from "../db/schema";
import type { createDatabase } from "../db/client";

type Database = ReturnType<typeof createDatabase>;

type ApiRouteOptions = {
  db: Database;
};

export const registerApiRoutes: FastifyPluginAsync<ApiRouteOptions> = async (app, options) => {
  app.get("/status", async () => ({
    database: options.db ? "configured" : "not_configured",
    ok: true,
  }));

  app.get("/workspaces", async (_request, reply) => {
    if (!options.db) return missingDatabase(reply);

    return options.db.select().from(workspaces).orderBy(asc(workspaces.name));
  });

  app.get<{ Params: { workspaceId: string } }>("/workspaces/:workspaceId/members", async (request, reply) => {
    if (!options.db) return missingDatabase(reply);

    return options.db
      .select()
      .from(members)
      .where(eq(members.workspaceId, request.params.workspaceId))
      .orderBy(asc(members.name));
  });

  app.get<{ Params: { workspaceId: string } }>("/workspaces/:workspaceId/channels", async (request, reply) => {
    if (!options.db) return missingDatabase(reply);

    return options.db
      .select()
      .from(channels)
      .where(eq(channels.workspaceId, request.params.workspaceId))
      .orderBy(asc(channels.name));
  });

  app.get<{ Params: { channelId: string } }>("/channels/:channelId/messages", async (request, reply) => {
    if (!options.db) return missingDatabase(reply);

    return options.db
      .select()
      .from(messages)
      .where(eq(messages.channelId, request.params.channelId))
      .orderBy(asc(messages.sentAt));
  });

  app.post<{ Body: CreateMessageInput; Params: { channelId: string } }>("/channels/:channelId/messages", async (request, reply) => {
    if (!options.db) return missingDatabase(reply);

    const body = request.body?.body?.trim() ?? "";
    const attachments = request.body?.attachments ?? [];
    if (!body && attachments.length === 0) return badRequest(reply, "消息内容或附件不能为空。");

    const [message] = await options.db
      .insert(messages)
      .values({
        attachments,
        authorId: emptyToUndefined(request.body.authorId),
        body,
        channelId: request.params.channelId,
        linkedApprovalId: emptyToUndefined(request.body.linkedApprovalId),
        linkedTaskId: emptyToUndefined(request.body.linkedTaskId),
      })
      .returning();

    return reply.status(201).send(message);
  });

  app.get<{ Params: { workspaceId: string } }>("/workspaces/:workspaceId/tasks", async (request, reply) => {
    if (!options.db) return missingDatabase(reply);

    return options.db
      .select()
      .from(tasks)
      .where(eq(tasks.workspaceId, request.params.workspaceId))
      .orderBy(desc(tasks.updatedAt));
  });

  app.post<{ Body: CreateTaskInput; Params: { workspaceId: string } }>("/workspaces/:workspaceId/tasks", async (request, reply) => {
    if (!options.db) return missingDatabase(reply);

    const title = request.body?.title?.trim() ?? "";
    if (!title) return badRequest(reply, "任务标题不能为空。");

    const [task] = await options.db
      .insert(tasks)
      .values({
        assigneeId: emptyToUndefined(request.body.assigneeId),
        channelId: request.body.channelId,
        due: request.body.due?.trim() ?? "今天",
        label: request.body.label?.trim() ?? "任务",
        priority: request.body.priority ?? "中",
        summary: request.body.summary?.trim() ?? "",
        title,
        workspaceId: request.params.workspaceId,
      })
      .returning();

    const [session] = await options.db
      .insert(agentSessions)
      .values({
        ownerId: task.assigneeId,
        taskId: task.id,
        title,
      })
      .returning();

    await options.db.insert(runtimeEvents).values({
      detail: task.summary || "已通过 API 创建新任务。",
      sessionId: session.id,
      title: "任务已创建",
      type: "message",
    });

    return reply.status(201).send({
      session,
      task,
    });
  });

  app.get<{ Params: { taskId: string } }>("/tasks/:taskId/sessions", async (request, reply) => {
    if (!options.db) return missingDatabase(reply);

    return options.db
      .select()
      .from(agentSessions)
      .where(eq(agentSessions.taskId, request.params.taskId))
      .orderBy(desc(agentSessions.startedAt));
  });

  app.get<{ Params: { sessionId: string } }>("/sessions/:sessionId/events", async (request, reply) => {
    if (!options.db) return missingDatabase(reply);

    return options.db
      .select()
      .from(runtimeEvents)
      .where(eq(runtimeEvents.sessionId, request.params.sessionId))
      .orderBy(asc(runtimeEvents.occurredAt));
  });

  app.get<{ Params: { workspaceId: string } }>("/workspaces/:workspaceId/approvals", async (request, reply) => {
    if (!options.db) return missingDatabase(reply);

    return options.db
      .select()
      .from(approvals)
      .where(eq(approvals.workspaceId, request.params.workspaceId))
      .orderBy(desc(approvals.updatedAt));
  });

  app.patch<{ Body: DecideApprovalInput; Params: { approvalId: string } }>("/approvals/:approvalId", async (request, reply) => {
    if (!options.db) return missingDatabase(reply);
    if (request.body.status !== "approved" && request.body.status !== "denied") {
      return badRequest(reply, "审批状态必须是 approved 或 denied。");
    }

    const [approval] = await options.db
      .update(approvals)
      .set({
        decidedAt: new Date(),
        decidedBy: emptyToUndefined(request.body.decidedBy),
        status: request.body.status,
        updatedAt: new Date(),
      })
      .where(eq(approvals.id, request.params.approvalId))
      .returning();

    if (!approval) {
      return reply.status(404).send({
        error: "not_found",
        message: "审批不存在。",
      });
    }

    if (approval.taskId) {
      await options.db
        .update(tasks)
        .set({
          status: request.body.status === "approved" ? "review" : "doing",
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, approval.taskId));

      const linkedSessions = await options.db
        .select()
        .from(agentSessions)
        .where(eq(agentSessions.taskId, approval.taskId))
        .orderBy(desc(agentSessions.startedAt));
      const latestSession = linkedSessions[0];

      if (latestSession) {
        await options.db.insert(runtimeEvents).values({
          detail:
            request.body.status === "approved"
              ? "审批已通过，任务进入待验收。"
              : "审批被拒绝，任务回到进行中。",
          sessionId: latestSession.id,
          title: request.body.status === "approved" ? "审批已通过" : "审批被拒绝",
          type: "result",
        });
      }
    }

    return approval;
  });

  app.get("/skills", async (_request, reply) => {
    if (!options.db) return missingDatabase(reply);

    return options.db.select().from(skills).orderBy(asc(skills.name));
  });

  app.get<{ Params: { workspaceId: string } }>("/workspaces/:workspaceId/skill-installs", async (request, reply) => {
    if (!options.db) return missingDatabase(reply);

    return options.db
      .select()
      .from(workspaceSkillInstalls)
      .where(eq(workspaceSkillInstalls.workspaceId, request.params.workspaceId))
      .orderBy(desc(workspaceSkillInstalls.installedAt));
  });
};

function missingDatabase(reply: FastifyReply) {
  return reply.status(503).send({
    error: "database_not_configured",
    message: "DATABASE_URL 未配置，API 当前只提供健康检查。",
  });
}

function badRequest(reply: FastifyReply, message: string) {
  return reply.status(400).send({
    error: "bad_request",
    message,
  });
}

function emptyToUndefined(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
