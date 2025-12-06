import api from './api';

export const mfaService = {
  /**
   * Request MFA OTP
   */
  challenge: async () => {
    const response = await api.post<{ message: string }>('/mfa/challenge');
    return response.data;
  },

  /**
   * Verify MFA OTP
   */
  verify: async (code: string, workspaceId?: string) => {
    const response = await api.post<{ message: string }>('/mfa/verify', {
      code,
      workspaceId,
    });
    return response.data;
  },
};

