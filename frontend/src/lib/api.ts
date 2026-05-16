import { clearToken, getToken } from "./auth";
import type {
  AboutResponse,
  LoginPayload,
  NotePayload,
  NoteResponse,
  RegisterPayload,
  SharePayload,
  TokenResponse,
  VersionResponse,
  NotificationResponse, // NEW: Imported Notification type
} from "../types";

// FIX: Explicitly use 127.0.0.1 to match Uvicorn's default IPv4 binding
const LOCAL_API_BASE_URL = "http://127.0.0.1:8000";

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  if (isLocalHostname(window.location.hostname)) {
    return LOCAL_API_BASE_URL;
  }

  return null;
}

function buildRequestUrl(path: string) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    throw new Error(
      "API base URL is not configured for this deployment. Set VITE_API_BASE_URL to your backend URL.",
    );
  }

  return `${apiBaseUrl}${path}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = buildRequestUrl(path);
  const token = getToken();
  const headers = new Headers(options.headers);

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    const connectionHint = url.startsWith(LOCAL_API_BASE_URL)
      ? `Cannot reach ${url}. Make sure the backend server is running on ${LOCAL_API_BASE_URL}.`
      : `Cannot reach ${url}. Check VITE_API_BASE_URL and confirm the backend allows requests from this frontend origin.`;
    console.error("Request failed", { url, error });
    throw new Error(connectionHint);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
    }
    throw new Error(data.detail ?? data.message ?? "Something went wrong");
  }

  return data as T;
}

export const api = {
  register: (payload: RegisterPayload) =>
    request<{ message: string }>("/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload: LoginPayload) =>
    request<TokenResponse>("/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  about: () => request<AboutResponse>("/about"),
  getNotes: () => request<NoteResponse[]>("/notes"),
  getNote: (id: string) => request<NoteResponse>(`/notes/${id}`),
  createNote: (payload: NotePayload) =>
    request<NoteResponse>("/notes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateNote: (id: string, payload: NotePayload) =>
    request<NoteResponse>(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteNote: (id: string) =>
    request<void>(`/notes/${id}`, {
      method: "DELETE",
    }),
  shareNote: (id: string, payload: SharePayload) =>
    request<{ message: string }>(`/notes/${id}/share`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getHistory: (id: string) => request<VersionResponse[]>(`/notes/${id}/history`),
  restoreVersion: (noteId: string, versionId: string) =>
    request<NoteResponse>(`/notes/${noteId}/restore/${versionId}`, {
      method: "POST",
    }),
    
  // NEW: Notification Endpoints
  getNotifications: () => request<NotificationResponse[]>("/notifications"),
  markNotificationRead: (id: string) => 
    request<NotificationResponse>(`/notifications/${id}/read`, {
      method: "PUT",
    }),
};