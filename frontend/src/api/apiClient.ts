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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const RETRY_DELAYS_MS = [350, 900];

function getFallbackProblemDetail(response: Response): ProblemDetail {
  return {
    status: response.status,
    title: response.statusText,
    detail: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
  };
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

function dispatchGlobalHttpError(response: Response) {
  if (response.status === 403) {
    dispatchApiError({ type: "denied" });
  } else if (response.status === 404) {
    dispatchApiError({ type: "404" });
  }
}

function getRequestMethod(options: RequestInit): string {
  return (options.method ?? "GET").toUpperCase();
}

function canRetryRequest(options: RequestInit): boolean {
  return ["GET", "HEAD"].includes(getRequestMethod(options));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
): Promise<Response> {
  const shouldRetry = canRetryRequest(options);
  let lastNetworkError = false;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (
        !shouldRetry ||
        !RETRYABLE_STATUSES.has(response.status) ||
        attempt === RETRY_DELAYS_MS.length
      ) {
        return response;
      }
      lastNetworkError = false;
    } catch {
      if (!shouldRetry || attempt === RETRY_DELAYS_MS.length) {
        throw new Error("NETWORK_ERROR");
      }
      lastNetworkError = true;
    }

    await sleep(RETRY_DELAYS_MS[attempt]);
  }

  throw new Error(lastNetworkError ? "NETWORK_ERROR" : "UNREACHABLE_RETRY");
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

  const response = await fetchWithRetry(url, { ...options, headers });

  if (!response.ok) {
    const problem = await getProblemDetail(response);
    handleAuthExpiry(response, problem);
    dispatchGlobalHttpError(response);
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

  const response = await fetchWithRetry(url, { ...options, headers });

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

  const response = await fetchWithRetry(url, { ...options, headers });

  if (!response.ok) {
    const problem = await getProblemDetail(response);
    handleAuthExpiry(response, problem);
    dispatchGlobalHttpError(response);
    throw new ApiError(problem);
  }

  return response.text();
}
