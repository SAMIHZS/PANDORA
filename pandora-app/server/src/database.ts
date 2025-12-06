import { MongoClient, Db, ServerSelectionTimeoutError } from 'mongodb';
import { config } from './config';
import { logger } from './utils/logger';

class Database {
  private static client: MongoClient | null = null;
  private static db: Db | null = null;

  static async connect(): Promise<void> {
    try {
      this.client = new MongoClient(config.MONGODB_URL, {
        serverSelectionTimeoutMS: 5000,
      });

      await this.client.connect();
      this.db = this.client.db(config.DB_NAME);

      // Verify connection
      await this.db.admin().ping();
      logger.info('✓ Connected to MongoDB');

      // Create indexes for performance
      await this.createIndexes();
    } catch (error) {
      if (error instanceof ServerSelectionTimeoutError) {
        logger.error(`✗ Failed to connect to MongoDB: ${error.message}`);
      } else {
        logger.error(`✗ Database connection error: ${error}`);
      }
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      logger.info('✓ Disconnected from MongoDB');
    }
  }

  static getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  private static async createIndexes(): Promise<void> {
    if (!this.db) return;

    try {
      // Users
      await this.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await this.db.collection('users').createIndex({ googleId: 1 }, { unique: true, sparse: true });

      // Workspaces
      await this.db.collection('workspaces').createIndex({ createdBy: 1 });

      // Workspace Members
      await this.db.collection('workspace_members').createIndex(
        { workspaceId: 1, userId: 1 },
        { unique: true }
      );

      // Messages
      await this.db.collection('messages').createIndex({ workspaceId: 1 });
      await this.db.collection('messages').createIndex({ senderId: 1 });

      // Files
      await this.db.collection('files').createIndex({ workspaceId: 1 });
      await this.db.collection('files').createIndex({ uploadedBy: 1 });

      // Audit Logs
      await this.db.collection('audit_logs').createIndex({ userId: 1 });
      await this.db.collection('audit_logs').createIndex({ workspaceId: 1 });
      await this.db.collection('audit_logs').createIndex({ createdAt: -1 });

      // Trust Events
      await this.db.collection('trust_events').createIndex({ userId: 1, workspaceId: 1 });

      // Join Invites
      await this.db.collection('join_invites').createIndex({ token: 1 }, { unique: true });
      await this.db.collection('join_invites').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

      // MFA OTPs
      await this.db.collection('mfa_otps').createIndex({ userId: 1 });
      await this.db.collection('mfa_otps').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

      logger.info('✓ Database indexes created');
    } catch (error) {
      logger.error(`Error creating indexes: ${error}`);
    }
  }
}

export const connectDatabase = Database.connect.bind(Database);
export const disconnectDatabase = Database.disconnect.bind(Database);
export const getDatabase = Database.getDb.bind(Database);
