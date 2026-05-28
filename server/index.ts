import { buildApp } from "./http/app";
import { readServerEnv } from "./env";

async function start() {
  const env = readServerEnv();
  const app = buildApp();

  try {
    await app.listen({
      host: env.apiHost,
      port: env.apiPort,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
