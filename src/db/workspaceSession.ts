import { BRAND } from "@/lib/brand";

const KEY = `${BRAND.storagePrefix}active_workspace_id`;

export function setActiveWorkspaceId(id: string | null) {
  if (!id) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, id);
}

export function getActiveWorkspaceId(): string {
  const id = localStorage.getItem(KEY);
  if (!id) throw new Error("No active workspace. Sign in again.");
  return id;
}

export function peekActiveWorkspaceId(): string | null {
  return localStorage.getItem(KEY);
}
