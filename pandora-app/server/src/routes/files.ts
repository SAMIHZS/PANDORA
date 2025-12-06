import { Router, Response } from 'express';
import multer from 'multer';
import { fileService } from '../services/FileService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { config } from '../config';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.MAX_FILE_SIZE_MB * 1024 * 1024, // Convert MB to bytes
  },
});

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/workspaces/:workspaceId/files
 * Upload file
 */
router.post(
  '/:workspaceId/files',
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { sensitivityLevel } = req.body;

      const result = await fileService.uploadFile(
        req.params.workspaceId,
        req.userId!,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        sensitivityLevel || 'internal'
      );

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to upload file' });
    }
  }
);

/**
 * GET /api/workspaces/:workspaceId/files
 * Get workspace files
 */
router.get('/:workspaceId/files', async (req: AuthRequest, res: Response) => {
  try {
    const files = await fileService.getWorkspaceFiles(req.params.workspaceId, req.userId!);

    res.json({ files });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to get files' });
  }
});

/**
 * GET /api/workspaces/:workspaceId/files/:fileId/download
 * Download file
 */
router.get('/:workspaceId/files/:fileId/download', async (req: AuthRequest, res: Response) => {
  try {
    const { fileBuffer, filename, mimeType } = await fileService.downloadFile(
      req.params.workspaceId,
      req.params.fileId,
      req.userId!
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to download file' });
  }
});

/**
 * GET /api/workspaces/:workspaceId/files/:fileId/versions
 * Get file versions
 */
router.get('/:workspaceId/files/:fileId/versions', async (req: AuthRequest, res: Response) => {
  try {
    const versions = await fileService.getFileVersions(req.params.fileId, req.userId!);

    res.json({ versions });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to get file versions' });
  }
});

/**
 * DELETE /api/workspaces/:workspaceId/files/:fileId
 * Delete file
 */
router.delete('/:workspaceId/files/:fileId', async (req: AuthRequest, res: Response) => {
  try {
    await fileService.deleteFile(req.params.fileId, req.userId!);

    res.json({ message: 'File deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete file' });
  }
  });

export default router;
