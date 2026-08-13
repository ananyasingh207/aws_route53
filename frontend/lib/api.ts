import { ApiError } from "./errors";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Local token storage helpers
const TOKEN_KEY = "route53_access_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface LoginResponse {
  message: string;
  user: UserResponse;
  access_token: string;
  token_type: string;
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

export interface DNSRecord {
  id: number;
  hosted_zone_id: number;
  name: string;
  type: string;
  ttl: number;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface DNSRecordListResponse {
  items: DNSRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface DNSRecordCreateInput {
  name: string;
  type: string;
  ttl: number;
  value: string;
}

export interface DNSRecordUpdateInput {
  name?: string;
  type?: string;
  ttl?: number;
  value?: string;
}

// Retry delays for server cold starts (network-level errors only)
const MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [3000, 6000];

function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ERR_NETWORK") ||
        error.message.includes("Load failed")))
  );
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

  const token = getStoredToken();
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include",
  };

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, mergedOptions);

      if (!response.ok) {
        let errorDetail = `Request failed with status ${response.status}`;
        let rawJson: any = null;
        try {
          rawJson = await response.json();
          if (rawJson && rawJson.detail) {
            errorDetail =
              typeof rawJson.detail === "string"
                ? rawJson.detail
                : JSON.stringify(rawJson.detail);
          }
        } catch {
          // Ignore JSON parse errors for non-JSON error responses
        }
        throw new ApiError(response.status, errorDetail, rawJson);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error;

      if (error instanceof ApiError || !isNetworkError(error)) {
        throw error;
      }

      if (options.signal?.aborted) {
        throw error;
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAYS_MS[attempt])
        );
      }
    }
  }

  throw lastError;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const response = await apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (response.access_token) {
    storeToken(response.access_token);
  }
  return response;
}

export async function getMeApi(): Promise<UserResponse> {
  return apiFetch<UserResponse>("/api/auth/me", {
    method: "GET",
  });
}

export async function logoutApi(): Promise<{ message: string }> {
  const response = await apiFetch<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });
  clearToken();
  return response;
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

// DNS Records API methods
export async function listDNSRecordsApi(
  zoneId: number,
  search: string = "",
  typeFilter: string = "",
  page: number = 1,
  limit: number = 10,
  signal?: AbortSignal
): Promise<DNSRecordListResponse> {
  const queryParams = new URLSearchParams();
  if (search.trim()) queryParams.set("search", search.trim());
  if (typeFilter.trim()) queryParams.set("type", typeFilter.trim());
  queryParams.set("page", page.toString());
  queryParams.set("limit", limit.toString());

  return apiFetch<DNSRecordListResponse>(
    `/api/hosted-zones/${zoneId}/records?${queryParams.toString()}`,
    {
      method: "GET",
      signal,
    }
  );
}

export async function getDNSRecordApi(id: number): Promise<DNSRecord> {
  return apiFetch<DNSRecord>(`/api/records/${id}`, {
    method: "GET",
  });
}

export async function createDNSRecordApi(
  zoneId: number,
  input: DNSRecordCreateInput
): Promise<DNSRecord> {
  return apiFetch<DNSRecord>(`/api/hosted-zones/${zoneId}/records`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateDNSRecordApi(
  id: number,
  input: DNSRecordUpdateInput
): Promise<DNSRecord> {
  return apiFetch<DNSRecord>(`/api/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteDNSRecordApi(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/records/${id}`, {
    method: "DELETE",
  });
}
