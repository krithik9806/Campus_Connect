import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, isUsingPgMem } from './db/index.js';
import { seedDatabase } from './db/seed.js';

import authRouter from './routes/auth.js';
import eventsRouter from './routes/events.js';
import clubsRouter from './routes/clubs.js';
import adminRouter from './routes/admin.js';
import announcementsRouter from './routes/announcements.js';
import notificationsRouter from './routes/notifications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/clubs', clubsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/notifications', notificationsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CampusConnect API',
    timestamp: new Date().toISOString(),
    database: isUsingPgMem() ? 'pg-mem (PostgreSQL In-Memory Engine)' : 'PostgreSQL'
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDb();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 CampusConnect Server running on http://localhost:${PORT}`);
      console.log(`📊 Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${isUsingPgMem() ? 'pg-mem PostgreSQL' : 'Live PostgreSQL'}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
