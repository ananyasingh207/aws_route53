const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface LoginResponse {
  message: string;
  user: UserResponse;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body && !(options.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include", // Ensures HttpOnly cookies (route53_session) are sent/stored automatically by browser
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorDetail = typeof errorJson.detail === "string" 
          ? errorJson.detail 
          : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Ignore JSON parse errors for non-JSON error responses
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMeApi(): Promise<UserResponse> {
  return apiFetch<UserResponse>("/api/auth/me", {
    method: "GET",
  });
}

export async function logoutApi(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });
}
