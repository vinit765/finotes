export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
}

export interface NotePayload {
  title: string;
  content: string;
}

export interface NoteResponse {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// UPDATED: Added the permission field for RBAC
export interface SharePayload {
  share_with_email: string;
  permission: "read" | "write";
}

export interface VersionResponse {
  id: string;
  version_number: number;
  title: string;
  content: string;
  created_at: string;
}

export interface AboutResponse {
  name: string;
  email: string;
  my_features: Record<string, string>;
  "my features"?: Record<string, string>;
}

// NEW: Added the Notification Response interface
export interface NotificationResponse {
  id: string;
  message: string;
  note_id: string;
  is_read: boolean;
  created_at: string;
}