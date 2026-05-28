import type { CrewlyDataSourceMode } from "../../shared/api-contracts";

const remoteApiBaseUrl = process.env.NEXT_PUBLIC_CREWLY_API_URL ?? "";
const configuredMode = process.env.NEXT_PUBLIC_CREWLY_DATA_SOURCE;

export const crewlyDataSource = {
  apiBaseUrl: remoteApiBaseUrl,
  mode: resolveDataSourceMode(configuredMode, remoteApiBaseUrl),
};

function resolveDataSourceMode(value: string | undefined, apiBaseUrl: string): CrewlyDataSourceMode {
  if (value === "remote" && apiBaseUrl) return "remote";
  return "local";
}
