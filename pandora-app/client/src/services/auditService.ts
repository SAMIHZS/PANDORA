import api from './api';

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  workspaceId: string | null;
  action: string;
  targetId?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export const auditService = {
  /**
   * Get audit logs
   */
  list: async (params?: {
    workspaceId?: string;
    action?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get<{ logs: AuditLog[] }>('/audit', { params });
    return response.data.logs;
  },

  /**
   * Get workspace audit logs
   */
  getWorkspaceLogs: async (workspaceId: string, limit: number = 100, offset: number = 0) => {
    const response = await api.get<{ logs: AuditLog[] }>(
      `/audit/workspace/${workspaceId}`,
      { params: { limit, offset } }
    );
    return response.data.logs;
  },
};

