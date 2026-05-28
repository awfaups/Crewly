type ServerEnv = {
  apiHost: string;
  apiPort: number;
  corsOrigin: string;
  databaseUrl?: string;
  nodeEnv: string;
};

export function readServerEnv(): ServerEnv {
  return {
    apiHost: process.env.API_HOST ?? "127.0.0.1",
    apiPort: parsePort(process.env.API_PORT, 4000),
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    databaseUrl: process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV ?? "development",
  };
}

function parsePort(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
