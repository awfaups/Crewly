import type {
  ApiStatusResponse,
  CreateMessageInput,
  CreateTaskInput,
  CreateTaskResponse,
  DecideApprovalInput,
} from "../../shared/api-contracts";

type ApiClientOptions = {
  baseUrl: string;
};

export function createCrewlyApiClient({ baseUrl }: ApiClientOptions) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  return {
    createMessage: (channelId: string, input: CreateMessageInput) =>
      request(`${normalizedBaseUrl}/api/channels/${channelId}/messages`, {
        body: JSON.stringify(input),
        method: "POST",
      }),
    createTask: (workspaceId: string, input: CreateTaskInput) =>
      request<CreateTaskResponse>(`${normalizedBaseUrl}/api/workspaces/${workspaceId}/tasks`, {
        body: JSON.stringify(input),
        method: "POST",
      }),
    decideApproval: (approvalId: string, input: DecideApprovalInput) =>
      request(`${normalizedBaseUrl}/api/approvals/${approvalId}`, {
        body: JSON.stringify(input),
        method: "PATCH",
      }),
    getStatus: () => request<ApiStatusResponse>(`${normalizedBaseUrl}/api/status`),
  };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Crewly API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
