import cors from "@fastify/cors";
import Fastify from "fastify";

import { createDatabase } from "../db/client";
import { readServerEnv } from "../env";
import { registerApiRoutes } from "./routes";

export function buildApp() {
  const env = readServerEnv();
  const app = Fastify({
    logger: env.nodeEnv !== "test",
  });
  const db = createDatabase();

  void app.register(cors, {
    origin: env.corsOrigin,
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    void reply.status(500).send({
      error: "internal_server_error",
      message: "服务暂时不可用",
    });
  });

  app.get("/health", async () => ({
    database: db ? "configured" : "not_configured",
    ok: true,
    service: "crewly-api",
  }));

  void app.register(registerApiRoutes, {
    db,
    prefix: "/api",
  });

  return app;
}
