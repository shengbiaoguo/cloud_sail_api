import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  CORS_ORIGIN: Joi.string().default('*'),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  UPLOAD_STORAGE: Joi.string().valid('local').default('local'),
  UPLOAD_DIR: Joi.string().default('uploads'),
  UPLOAD_BASE_URL: Joi.string().default('/uploads'),
  REDIS_HOST: Joi.string().default('127.0.0.1'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_DB: Joi.number().integer().min(0).default(0)
});
