server/src/main.ts: This file is the entry point of the server application. It initializes the Express app, sets up middleware, and connects to the database.

import express from 'express';
import { json } from 'body-parser';
import { connectDatabase } from './database';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspaces';
import messageRoutes from './routes/messages';
import fileRoutes from './routes/files';
import mfaRoutes from './routes/mfa';
import auditRoutes from './routes/audit';
import errorHandler from './middleware/errorHandler';
import { config } from './config';

const app = express();

// Middleware
app.use(json());

// Connect to the database
connectDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/audit', auditRoutes);

// Error handling middleware
app.use(errorHandler);

// Start the server
const PORT = config.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});