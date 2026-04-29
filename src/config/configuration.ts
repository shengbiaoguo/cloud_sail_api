export default () => ({
  app: {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3000),
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },
  database: {
    url: process.env.DATABASE_URL || ''
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  upload: {
    storage: process.env.UPLOAD_STORAGE || 'local',
    dir: process.env.UPLOAD_DIR || 'uploads',
    baseUrl: process.env.UPLOAD_BASE_URL || '/uploads'
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    db: Number(process.env.REDIS_DB || 0),
    password: process.env.REDIS_PASSWORD || ''
  }
});
