import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import path from 'path';
import { connectDatabase, disconnectDatabase } from './database';
import { config } from './config';
import { logger } from './utils/logger';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspaces';
import messageRoutes from './routes/messages';
import fileRoutes from './routes/files';
import mfaRoutes from './routes/mfa';
import auditRoutes from './routes/audit';
import errorHandler from './middleware/errorHandler';

const app = express();
const PORT = config.PORT;

// CORS middleware
app.use(
  cors({
    origin: config.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: '✓ PANDORA is running',
    version: config.APP_VERSION,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    app: config.APP_NAME,
    version: config.APP_VERSION,
    status: 'ready',
    docs: '/docs',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces', messageRoutes); // Messages are nested under workspaces
app.use('/api/workspaces', fileRoutes); // Files are nested under workspaces
app.use('/api/mfa', mfaRoutes);
app.use('/api/audit', auditRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    
    // Create uploads directory if it doesn't exist
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    app.listen(PORT, () => {
      logger.info(`🚀 ${config.APP_NAME} v${config.APP_VERSION} is running on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('🛑 Shutting down PANDORA...');
      await disconnectDatabase();
      process.exit(0);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
};

startServer();

export default app;
