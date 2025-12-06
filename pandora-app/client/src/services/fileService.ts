import api from './api';

export interface File {
  id: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  sensitivityLevel: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
}

export interface FileVersion {
  versionNumber: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
}

export const fileService = {
  /**
   * Upload file
   */
  upload: async (
    workspaceId: string,
    file: File,
    sensitivityLevel: string = 'internal'
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sensitivityLevel', sensitivityLevel);

    const response = await api.post<{ id: string; filename: string; fileSize: number; createdAt: string }>(
      `/workspaces/${workspaceId}/files`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Get workspace files
   */
  list: async (workspaceId: string) => {
    const response = await api.get<{ files: File[] }>(`/workspaces/${workspaceId}/files`);
    return response.data.files;
  },

  /**
   * Download file
   */
  download: async (workspaceId: string, fileId: string) => {
    const response = await api.get(`/workspaces/${workspaceId}/files/${fileId}/download`, {
      responseType: 'blob',
    });

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch ? filenameMatch[1] : 'download';

    // Create blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { filename };
  },

  /**
   * Get file versions
   */
  getVersions: async (workspaceId: string, fileId: string) => {
    const response = await api.get<{ versions: FileVersion[] }>(
      `/workspaces/${workspaceId}/files/${fileId}/versions`
    );
    return response.data.versions;
  },

  /**
   * Delete file
   */
  delete: async (workspaceId: string, fileId: string) => {
    const response = await api.delete<{ message: string }>(
      `/workspaces/${workspaceId}/files/${fileId}`
    );
    return response.data;
  },
};

