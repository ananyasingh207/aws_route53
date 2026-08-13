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

export interface HostedZone {
  id: number;
  name: string;
  zone_type: string;
  description: string;
  private_zone: boolean;
  created_at: string;
  updated_at: string;
  user_id: number;
}

export interface HostedZoneListResponse {
  items: HostedZone[];
  total: number;
  page: number;
  limit: number;
}

export interface HostedZoneCreateInput {
  name: string;
  zone_type: string;
  description?: string;
  private_zone: boolean;
}

export interface HostedZoneUpdateInput {
  name?: string;
  zone_type?: string;
  description?: string;
  private_zone?: boolean;
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

// Authentication API methods
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

// Hosted Zones API methods
export async function listHostedZonesApi(
  search: string = "",
  page: number = 1,
  limit: number = 10,
  signal?: AbortSignal
): Promise<HostedZoneListResponse> {
  const queryParams = new URLSearchParams();
  if (search.trim()) queryParams.set("search", search.trim());
  queryParams.set("page", page.toString());
  queryParams.set("limit", limit.toString());

  return apiFetch<HostedZoneListResponse>(`/api/hosted-zones?${queryParams.toString()}`, {
    method: "GET",
    signal,
  });
}

export async function getHostedZoneApi(id: number): Promise<HostedZone> {
  return apiFetch<HostedZone>(`/api/hosted-zones/${id}`, {
    method: "GET",
  });
}

export async function createHostedZoneApi(
  input: HostedZoneCreateInput
): Promise<HostedZone> {
  return apiFetch<HostedZone>("/api/hosted-zones", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateHostedZoneApi(
  id: number,
  input: HostedZoneUpdateInput
): Promise<HostedZone> {
  return apiFetch<HostedZone>(`/api/hosted-zones/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteHostedZoneApi(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/hosted-zones/${id}`, {
    method: "DELETE",
  });
}
