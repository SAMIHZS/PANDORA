import { ObjectId } from 'mongodb';
import { getDatabase } from '../database';
import { encryptionService } from '../crypto/encryption';
import { config } from '../config';
import { logger } from '../utils/logger';
import { workspaceService } from './WorkspaceService';
import { auditService } from './AuditService';
import * as fs from 'fs';
import * as path from 'path';

export interface File {
  _id?: string;
  workspaceId: string;
  uploadedBy: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  sensitivityLevel: 'public' | 'internal' | 'confidential';
  encryptedBlobPath: string;
  createdAt: Date;
}

export interface FileVersion {
  _id?: string;
  fileId: string;
  versionNumber: number;
  encryptedBlobPath: string;
  uploadedBy: string;
  uploadedAt: Date;
}

/**
 * File Service - Handles encrypted file storage and versioning
 */
export class FileService {
  /**
   * Upload and encrypt file
   */
  static async uploadFile(
    workspaceId: string,
    userId: string,
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    sensitivityLevel: 'public' | 'internal' | 'confidential' = 'internal'
  ): Promise<{
    id: string;
    filename: string;
    fileSize: number;
    createdAt: Date;
  }> {
    const db = getDatabase();

    // Verify user has access to workspace
    const member = await db.collection('workspace_members').findOne({
      userId,
      workspaceId,
      status: 'active',
    });

    if (!member) {
      throw new Error('Not authorized to upload files to this workspace');
    }

    // Check access level
    if (member.accessLevel === 'blocked' || member.accessLevel === 'viewOnly') {
      throw new Error('Access level does not allow file uploads');
    }

    // Get workspace encryption key
    const workspaceKey = await workspaceService.getWorkspaceKey(workspaceId, userId);

    // Encrypt file
    const { encryptedData } = encryptionService.encryptFile(fileBuffer, workspaceKey);

    // Save encrypted file to disk
    const fileId = new ObjectId().toString();
    const encryptedPath = path.join(config.UPLOAD_DIR, `${fileId}.enc`);

    // Ensure uploads directory exists
    if (!fs.existsSync(config.UPLOAD_DIR)) {
      fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
    }

    fs.writeFileSync(encryptedPath, encryptedData);

    // Save file metadata
    const fileDoc: File = {
      _id: fileId,
      workspaceId,
      uploadedBy: userId,
      filename: `${fileId}_${filename}`,
      originalFilename: filename,
      fileSize: fileBuffer.length,
      mimeType,
      sensitivityLevel,
      encryptedBlobPath: encryptedPath,
      createdAt: new Date(),
    };

    await db.collection('files').insertOne(fileDoc);

    // Create initial version
    const version: FileVersion = {
      _id: new ObjectId().toString(),
      fileId,
      versionNumber: 1,
      encryptedBlobPath: encryptedPath,
      uploadedBy: userId,
      uploadedAt: new Date(),
    };

    await db.collection('file_versions').insertOne(version);

    logger.info(`File uploaded: ${filename} by ${userId} in workspace ${workspaceId}`);

    await auditService.logAction(userId, workspaceId, 'file_uploaded', {
      fileId,
      filename,
      fileSize: fileBuffer.length,
      sensitivityLevel,
    });

    return {
      id: fileId,
      filename: fileDoc.filename,
      fileSize: fileDoc.fileSize,
      createdAt: fileDoc.createdAt,
    };
  }

  /**
   * Get workspace files
   */
  static async getWorkspaceFiles(workspaceId: string, userId: string): Promise<Array<{
    id: string;
    filename: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    sensitivityLevel: string;
    uploadedBy: string;
    uploadedByName: string;
    createdAt: Date;
  }>> {
    const db = getDatabase();

    // Verify user has access to workspace
    const member = await db.collection('workspace_members').findOne({
      userId,
      workspaceId,
      status: 'active',
    });

    if (!member) {
      throw new Error('Not authorized to view files in this workspace');
    }

    const files = await db.collection<File>('files').find({ workspaceId }).toArray();

    const enrichedFiles = [];

    for (const file of files) {
      const uploader = await db.collection('users').findOne({ _id: file.uploadedBy });
      enrichedFiles.push({
        id: file._id,
        filename: file.filename,
        originalFilename: file.originalFilename,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        sensitivityLevel: file.sensitivityLevel,
        uploadedBy: file.uploadedBy,
        uploadedByName: uploader?.name || 'Unknown',
        createdAt: file.createdAt,
      });
    }

    return enrichedFiles;
  }

  /**
   * Download and decrypt file
   */
  static async downloadFile(
    workspaceId: string,
    fileId: string,
    userId: string
  ): Promise<{
    fileBuffer: Buffer;
    filename: string;
    mimeType: string;
  }> {
    const db = getDatabase();

    // Verify user has access to workspace
    const member = await db.collection('workspace_members').findOne({
      userId,
      workspaceId,
      status: 'active',
    });

    if (!member) {
      throw new Error('Not authorized to download files from this workspace');
    }

    // Check access level
    if (member.accessLevel === 'blocked') {
      throw new Error('Access blocked due to low trust score');
    }

    const file = await db.collection<File>('files').findOne({ _id: fileId, workspaceId });

    if (!file) {
      throw new Error('File not found');
    }

    // Get workspace encryption key
    const workspaceKey = await workspaceService.getWorkspaceKey(workspaceId, userId);

    // Read encrypted file from disk
    if (!fs.existsSync(file.encryptedBlobPath)) {
      throw new Error('Encrypted file not found on disk');
    }

    const encryptedData = fs.readFileSync(file.encryptedBlobPath);

    // Decrypt file
    const decryptedBuffer = encryptionService.decryptFile(encryptedData, workspaceKey);

    logger.info(`File downloaded: ${file.originalFilename} by ${userId}`);

    await auditService.logAction(userId, workspaceId, 'file_downloaded', {
      fileId,
      filename: file.originalFilename,
    });

    return {
      fileBuffer: decryptedBuffer,
      filename: file.originalFilename,
      mimeType: file.mimeType,
    };
  }

  /**
   * Delete file
   */
  static async deleteFile(fileId: string, userId: string): Promise<void> {
    const db = getDatabase();

    const file = await db.collection<File>('files').findOne({ _id: fileId });

    if (!file) {
      throw new Error('File not found');
    }

    // Check if user is uploader or workspace owner
    const workspace = await db.collection('workspaces').findOne({ _id: file.workspaceId });
    const isOwner = workspace?.createdBy === userId;
    const isUploader = file.uploadedBy === userId;

    if (!isUploader && !isOwner) {
      throw new Error('Not authorized to delete this file');
    }

    // Delete encrypted file from disk
    if (fs.existsSync(file.encryptedBlobPath)) {
      fs.unlinkSync(file.encryptedBlobPath);
    }

    // Delete file metadata
    await db.collection('files').deleteOne({ _id: fileId });

    // Delete file versions
    await db.collection('file_versions').deleteMany({ fileId });

    logger.info(`File ${fileId} deleted by ${userId}`);

    await auditService.logAction(userId, file.workspaceId, 'file_deleted', {
      fileId,
      filename: file.originalFilename,
    });
  }

  /**
   * Get file versions
   */
  static async getFileVersions(fileId: string, userId: string): Promise<Array<{
    versionNumber: number;
    uploadedBy: string;
    uploadedByName: string;
    uploadedAt: Date;
  }>> {
    const db = getDatabase();

    const file = await db.collection<File>('files').findOne({ _id: fileId });

    if (!file) {
      throw new Error('File not found');
    }

    // Verify user has access to workspace
    const member = await db.collection('workspace_members').findOne({
      userId,
      workspaceId: file.workspaceId,
      status: 'active',
    });

    if (!member) {
      throw new Error('Not authorized');
    }

    const versions = await db
      .collection<FileVersion>('file_versions')
      .find({ fileId })
      .sort({ versionNumber: -1 })
      .toArray();

    const enrichedVersions = [];

    for (const version of versions) {
      const uploader = await db.collection('users').findOne({ _id: version.uploadedBy });
      enrichedVersions.push({
        versionNumber: version.versionNumber,
        uploadedBy: version.uploadedBy,
        uploadedByName: uploader?.name || 'Unknown',
        uploadedAt: version.uploadedAt,
      });
    }

    return enrichedVersions;
  }
}

export const fileService = FileService;
