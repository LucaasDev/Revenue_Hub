import { create } from 'zustand'
import type { Tables, Enums } from '@revenue-hub/database'

interface WorkspaceState {
  // Workspace ativo
  activeWorkspace: Pick<Tables<'workspaces'>, 'id' | 'name' | 'slug' | 'plan' | 'currency_base'> | null
  userRole: Enums<'workspace_role'> | null

  // Preferências de UI
  sidebarCollapsed: boolean
  activeMonth: Date

  // Actions
  setActiveWorkspace: (
    workspace: WorkspaceState['activeWorkspace'],
    role: WorkspaceState['userRole'],
  ) => void
  clearWorkspace: () => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setActiveMonth: (month: Date) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspace: null,
  userRole: null,
  sidebarCollapsed: false,
  activeMonth: new Date(),

  setActiveWorkspace: (workspace, role) =>
    set({ activeWorkspace: workspace, userRole: role }),

  clearWorkspace: () =>
    set({ activeWorkspace: null, userRole: null }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) =>
    set({ sidebarCollapsed: collapsed }),

  setActiveMonth: (month) =>
    set({ activeMonth: month }),
}))

// Selectors
export const selectIsAdmin = (state: WorkspaceState) =>
  state.userRole === 'owner' || state.userRole === 'admin'

export const selectIsOwner = (state: WorkspaceState) =>
  state.userRole === 'owner'
