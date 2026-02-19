import convict from 'convict';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = convict({
  env: {
    doc: 'Application environment',
    format: ['production', 'staging', 'development'],
    default: 'development',
    env: 'NODE_ENV'
  },

  server: {
    host: {
      doc: 'Server hostname',
      format: String,
      default: '0.0.0.0',
      env: 'SERVER_HOST'
    },
    port: {
      doc: 'API server port',
      format: 'port',
      default: 3000,
      env: 'SERVER_PORT'
    }
  },

  database: {
    url: {
      doc: 'PostgreSQL connection string',
      format: String,
      env: 'DATABASE_URL',
      default: 'postgresql://voternet:voternet@localhost:5432/voternet_dev',
      sensitive: true
    }
  },

  redis: {
    url: {
      doc: 'Redis connection URL',
      format: String,
      env: 'REDIS_URL',
      default: 'redis://localhost:6379',
      sensitive: true
    }
  },

  jwt: {
    secret: {
      doc: 'JWT signing secret',
      format: String,
      env: 'JWT_SECRET',
      default: 'dev-secret-change-in-production',
      sensitive: true
    },
    refreshSecret: {
      doc: 'JWT refresh token secret',
      format: String,
      env: 'JWT_REFRESH_SECRET',
      default: 'dev-refresh-secret-change-in-production',
      sensitive: true
    },
    expiresIn: {
      doc: 'Access token expiration',
      format: String,
      default: '15m'
    },
    refreshExpiresIn: {
      doc: 'Refresh token expiration',
      format: String,
      default: '7d'
    }
  },

  frontend: {
    url: {
      doc: 'Frontend URL for CORS',
      format: String,
      env: 'FRONTEND_URL',
      default: 'http://localhost:3000'
    }
  },

  logging: {
    level: {
      doc: 'Log level',
      format: ['debug', 'info', 'warn', 'error'],
      default: 'info',
      env: 'LOG_LEVEL'
    }
  },

  rateLimit: {
    windowMs: {
      doc: 'Rate limit window in milliseconds',
      format: 'nat',
      env: 'RATE_LIMIT_WINDOW_MS',
      default: 900000 // 15 minutes
    },
    maxRequests: {
      doc: 'Max requests per window',
      format: 'nat',
      env: 'RATE_LIMIT_MAX_REQUESTS',
      default: 100
    }
  }
});

// Load environment-specific file if exists
const env = config.get('env');
try {
  // Will be compiled to .js in dist/
  config.loadFile(path.resolve(__dirname, `../../../.env.${env}`));
} catch (e) {
  // No file required, env vars used
}

config.validate({ allowed: 'strict' });

export { config };
