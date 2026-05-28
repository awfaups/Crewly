export type CrewlyDataSourceMode = "local" | "remote";

export type ApiErrorCode = "bad_request" | "database_not_configured" | "internal_server_error" | "not_found";

export type ApiErrorResponse = {
  error: ApiErrorCode;
  message: string;
};

export type CreateMessageInput = {
  attachments?: unknown[];
  authorId?: string;
  body: string;
  linkedApprovalId?: string;
  linkedTaskId?: string;
};

export type CreateTaskInput = {
  assigneeId?: string;
  channelId: string;
  due?: string;
  label?: string;
  priority?: "高" | "中" | "低";
  summary?: string;
  title: string;
};

export type DecideApprovalInput = {
  decidedBy?: string;
  status: "approved" | "denied";
};

export type CreateTaskResponse = {
  session: unknown;
  task: unknown;
};

export type ApiStatusResponse = {
  database: "configured" | "not_configured";
  ok: boolean;
};
