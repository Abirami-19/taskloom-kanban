"use client";

import { create } from "zustand";
import type { Workspace } from "@/lib/types";

type WorkspaceState = {
  activeWorkspaceId: string | null;
  workspaces: Workspace[];
  setActiveWorkspace: (workspaceId: string) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspaceId: null,
  workspaces: [],
  setActiveWorkspace: (workspaceId) => set({ activeWorkspaceId: workspaceId }),
  setWorkspaces: (workspaces) => set({ workspaces })
}));
