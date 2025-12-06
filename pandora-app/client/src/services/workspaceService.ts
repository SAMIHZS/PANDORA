import api from './api';

export interface Workspace {
  id: string;
  name: string;
  role: string;
  accessLevel: string;
  trustScore: number;
  createdAt: string;
  status?: string;
}

export interface JoinInvite {
  joinUrl: string;
  token: string;
  expiresAt: string;
}

export interface PendingMember {
  userId: string;
  userEmail: string;
  userName: string;
  joinedAt: string;
}

export const workspaceService = {
  /**
   * Create workspace (admin only)
   */
  create: async (name: string) => {
    const response = await api.post<{ id: string; name: string; createdAt: string }>(
      '/workspaces',
      { name }
    );
    return response.data;
  },

  /**
   * Get user's workspaces
   */
  list: async () => {
    const response = await api.get<{ workspaces: Workspace[] }>('/workspaces');
    return response.data.workspaces;
  },

  /**
   * Get workspace details
   */
  getById: async (id: string) => {
    const response = await api.get<Workspace>(`/workspaces/${id}`);
    return response.data;
  },

  /**
   * Get workspace encryption key
   */
  getKey: async (id: string) => {
    const response = await api.get<{ encryptionKey: string }>(`/workspaces/${id}/key`);
    return response.data.encryptionKey;
  },

  /**
   * Generate join invite
   */
  generateInvite: async (workspaceId: string) => {
    const response = await api.post<JoinInvite>(`/workspaces/${workspaceId}/invites`);
    return response.data;
  },

  /**
   * Join workspace via invite token
   */
  joinWorkspace: async (token: string) => {
    const response = await api.post<{ message: string; workspaceId: string }>(
      `/workspaces/join/${token}`
    );
    return response.data;
  },

  /**
   * Get pending members
   */
  getPendingMembers: async (workspaceId: string) => {
    const response = await api.get<{ pendingMembers: PendingMember[] }>(
      `/workspaces/${workspaceId}/pending`
    );
    return response.data.pendingMembers;
  },

  /**
   * Approve member
   */
  approveMember: async (workspaceId: string, userId: string, role: string = 'editor') => {
    const response = await api.post<{ message: string }>(
      `/workspaces/${workspaceId}/members/${userId}/approve`,
      { role }
    );
    return response.data;
  },
};

