import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { supabase } from './db/supabase.js';
import { requestLogger } from './middleware/requestLogger.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { authMiddleware } from './middleware/auth.middleware.js';

// Routes
import vapiRoutes from './routes/vapi.routes.js';
import authRoutes from './routes/auth.routes.js';
import callsRoutes from './routes/calls.routes.js';
import scenariosRoutes from './routes/scenarios.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import schoolRoutes from './routes/school.routes.js';
import invitesRoutes from './routes/invites.routes.js';
import adminRoutes from './routes/admin.routes.js';
import vapiConfigRoutes from './routes/vapiConfig.routes.js';
import systemRoutes from './routes/system.routes.js';
import automationRoutes from './routes/automation.routes.js';

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || config.allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.path === '/auth/me' || req.path === '/vapi/webhook' || req.path.startsWith('/invites/'),
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

app.get('/health', async (_req, res) => {
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    res.status(200).json({ status: 'ok', db: 'connected', uptime: Math.floor(process.uptime()) });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// Public routes (no auth)
app.use('/api/vapi', vapiRoutes);
app.use('/api/invites', invitesRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/automation', automationRoutes);

// All routes below require a valid Supabase session
app.use('/api', authMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/scenarios', scenariosRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vapi-config', vapiConfigRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

app.use(errorHandler);

app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.isProduction ? 'production' : 'development' }, 'Server started');
});
