import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { startNotificationScheduler } from './services/notificationService';

// Import routes
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import notificationRoutes from './routes/notificationRoutes';
import notificationCenterRoutes from './routes/notificationCenterRoutes';
import accountRoutes from './routes/accountRoutes';
import telegramRoutes from './routes/telegramRoutes';
import schedulerRoutes from './routes/schedulerRoutes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health check routes
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'TaskStudy API is running! 🚀',
    version: '1.0.0',
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notification-center', notificationCenterRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/scheduler', schedulerRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error Handler
app.use((err: Error, _req: Request, res: Response) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start notification scheduler
    startNotificationScheduler();

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;