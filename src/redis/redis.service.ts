import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private connected = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(RedisService.name);
  }

  async onModuleInit() {
    const host = this.configService.get<string>('redis.host', '127.0.0.1');
    const port = this.configService.get<number>('redis.port', 6379);
    const db = this.configService.get<number>('redis.db', 0);
    const password = this.configService.get<string>('redis.password', '');

    this.client = new Redis({
      host,
      port,
      db,
      password: password || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });

    this.client.on('ready', () => {
      this.connected = true;
      this.logger.info(`Redis connected: ${host}:${port}/${db}`);
    });

    this.client.on('error', (error: Error) => {
      this.connected = false;
      this.logger.warn(`Redis error: ${error.message}`);
    });

    this.client.on('end', () => {
      this.connected = false;
      this.logger.warn('Redis connection closed');
    });

    try {
      await this.client.connect();
    } catch (error) {
      this.connected = false;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis unavailable, fallback to DB only: ${message}`);
    }
  }

  async onModuleDestroy() {
    if (!this.client) {
      return;
    }

    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    } finally {
      this.client = null;
      this.connected = false;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (!this.client || !this.connected) {
      return null;
    }

    try {
      const value = await this.client.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis getJson failed for key ${key}: ${message}`);
      return null;
    }
  }

  async getNumber(key: string): Promise<number> {
    if (!this.client || !this.connected) {
      return 0;
    }

    try {
      const value = await this.client.get(key);
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis getNumber failed for key ${key}: ${message}`);
      return 0;
    }
  }

  async increment(key: string): Promise<number> {
    if (!this.client || !this.connected) {
      return 0;
    }

    try {
      return await this.client.incr(key);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis increment failed for key ${key}: ${message}`);
      return 0;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      const payload = this.safeStringify(value);

      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, payload, 'EX', ttlSeconds);
        return;
      }

      await this.client.set(key, payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis setJson failed for key ${key}: ${message}`);
    }
  }

  private safeStringify(value: unknown): string {
    return JSON.stringify(value, (_key, currentValue) =>
      typeof currentValue === 'bigint' ? currentValue.toString() : currentValue
    );
  }

  async delete(key: string): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis delete failed for key ${key}: ${message}`);
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (!this.client || !this.connected || keys.length === 0) {
      return;
    }

    try {
      await this.client.del(keys);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis deleteMany failed: ${message}`);
    }
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      let cursor = '0';
      const keysToDelete: string[] = [];

      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          `${prefix}*`,
          'COUNT',
          '100'
        );

        cursor = nextCursor;
        keysToDelete.push(...keys);
      } while (cursor !== '0');

      if (keysToDelete.length > 0) {
        await this.client.del(keysToDelete);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis deleteByPrefix failed for prefix ${prefix}: ${message}`);
    }
  }
}
