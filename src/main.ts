import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppDataSource } from './libraries/database/data-source.js';
import { config } from './libraries/config/config.js';
import { logger } from './libraries/logger/logger.js';
import { authRoutes } from './apps/auth/entry-points/auth.routes.js';
import { userRoutes } from './apps/users/entry-points/user.routes.js';
import electionRoutes from './apps/elections/routes/election.routes.js';
import candidateRoutes from './apps/elections/routes/candidate.routes.js';
import votingRoutes from './apps/elections/routes/voting.routes.js';
import civicFeedRoutes from './apps/civic/routes/civic-feed.routes.js';
import { errorHandler } from './middleware/error-handler.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { initializeRedis } from './libraries/redis/redis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security - relaxed CSP for development
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "http://localhost:3000"]
    }
  }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Logging
app.use(pinoHttp({ logger }));

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/civic', civicFeedRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function bootstrap() {
  try {
    // Initialize Redis (optional for development)
    try {
      await initializeRedis();
      logger.info('✓ Redis connected');
    } catch (error) {
      logger.warn('⚠ Redis not available - using in-memory session storage');
    }

    // Initialize database
    await AppDataSource.initialize();
    logger.info('✓ Database connected');

    // Start server
    const port = config.get('server.port');
    const host = config.get('server.host');
    app.listen(port, host, () => {
      logger.info(`✓ Server running on http://${host}:${port}`);
      logger.info(`✓ Environment: ${config.get('env')}`);
    });
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

bootstrap();

export default app;
