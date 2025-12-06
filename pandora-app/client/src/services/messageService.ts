import api from './api';

export interface Message {
  id: string;
  workspaceId: string;
  senderId: string;
  senderName: string;
  encryptedContent: string;
  nonce: string;
  createdAt: string;
}

export const messageService = {
  /**
   * Send encrypted message
   */
  send: async (workspaceId: string, content: string, nonce: string) => {
    const response = await api.post<{ id: string; createdAt: string }>(
      `/workspaces/${workspaceId}/messages`,
      { content, nonce }
    );
    return response.data;
  },

  /**
   * Get workspace messages
   */
  list: async (workspaceId: string, limit: number = 50) => {
    const response = await api.get<{ messages: Message[] }>(
      `/workspaces/${workspaceId}/messages`,
      { params: { limit } }
    );
    return response.data.messages;
  },

  /**
   * Delete message
   */
  delete: async (workspaceId: string, messageId: string) => {
    const response = await api.delete<{ message: string }>(
      `/workspaces/${workspaceId}/messages/${messageId}`
    );
    return response.data;
  },
};

