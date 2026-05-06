import { dispatchApiError } from "@/utils/apiErrorEvents";

export interface ProblemDetail {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
}

export class ApiError extends Error {
  public problem: ProblemDetail;

  constructor(problem: ProblemDetail) {
    super(problem.detail || problem.title || "API Error");
    this.name = "ApiError";
    this.problem = problem;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

function getFallbackProblemDetail(response: Response): ProblemDetail {
  return {
    status: response.status,
    title: response.statusText,
    detail: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
  };
}

function shouldDispatchMaintenanceError(
  response: Response,
  problem: ProblemDetail,
): boolean {
  if ([502, 503, 504].includes(response.status)) {
    return true;
  }

  const problemCode = problem.code?.toUpperCase();
  return (
    problemCode === "SERVICE_UNAVAILABLE" ||
    problemCode === "SYSTEM_UNAVAILABLE"
  );
}

async function getProblemDetail(response: Response): Promise<ProblemDetail> {
  try {
    return (await response.json()) as ProblemDetail;
  } catch {
    return getFallbackProblemDetail(response);
  }
}

function handleAuthExpiry(response: Response, problem: ProblemDetail) {
  if (response.status === 401 && problem.code === "TOKEN_EXPIRED") {
    window.dispatchEvent(new Event("auth:expired"));
  }
}

function dispatchGlobalHttpError(response: Response, problem: ProblemDetail) {
  if (shouldDispatchMaintenanceError(response, problem)) {
    dispatchApiError({ type: "maintenance" });
  } else if (response.status === 403) {
    dispatchApiError({ type: "denied" });
  } else if (response.status === 404) {
    dispatchApiError({ type: "404" });
  }
}

function buildHeaders(options: RequestInit, includeJsonContentType = true) {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const isFormData = options.body instanceof FormData;
  if (includeJsonContentType && !headers.has("Content-Type") && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = buildHeaders(options);

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    dispatchApiError({ type: "maintenance" });
    throw new Error("NETWORK_ERROR");
  }

  if (!response.ok) {
    const problem = await getProblemDetail(response);
    handleAuthExpiry(response, problem);
    dispatchGlobalHttpError(response, problem);
    throw new ApiError(problem);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const rawBody = await response.text();
  if (!rawBody.trim()) {
    return {} as T;
  }

  return JSON.parse(rawBody) as T;
}

export async function fetchApiBlob(
  endpoint: string,
  options: RequestInit = {},
): Promise<Blob> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = buildHeaders(options, false);

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    throw new Error("NETWORK_ERROR");
  }

  if (!response.ok) {
    const problem = await getProblemDetail(response);
    handleAuthExpiry(response, problem);
    throw new ApiError(problem);
  }

  return response.blob();
}

export async function fetchApiText(
  endpoint: string,
  options: RequestInit = {},
): Promise<string> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = buildHeaders(options, false);

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    dispatchApiError({ type: "maintenance" });
    throw new Error("NETWORK_ERROR");
  }

  if (!response.ok) {
    const problem = await getProblemDetail(response);
    handleAuthExpiry(response, problem);
    dispatchGlobalHttpError(response, problem);
    throw new ApiError(problem);
  }

  return response.text();
}
