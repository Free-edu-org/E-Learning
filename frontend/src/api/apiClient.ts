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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const token = localStorage.getItem('token');
    const headers = new Headers(options.headers);
    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    let response: Response;
    try {
        response = await fetch(url, { ...options, headers });
    } catch {
        // Network error
        throw new Error('NETWORK_ERROR');
    }

    if (!response.ok) {
        let problem: ProblemDetail;
        try {
            problem = await response.json();
        } catch {
            problem = {
                status: response.status,
                title: response.statusText,
                detail: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później."
            };
        }
        throw new ApiError(problem);
    }

    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}
