import { asc, desc, eq } from "drizzle-orm";
import type { FastifyPluginAsync, FastifyReply } from "fastify";

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

  app.get<{ Params: { workspaceId: string } }>("/workspaces/:workspaceId/tasks", async (request, reply) => {
    if (!options.db) return missingDatabase(reply);

    return options.db
      .select()
      .from(tasks)
      .where(eq(tasks.workspaceId, request.params.workspaceId))
      .orderBy(desc(tasks.updatedAt));
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
