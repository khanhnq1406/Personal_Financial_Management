import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ProvidersName } from 'src/utils/constants';

@Injectable()
export class RedisRepository {
  constructor(
    @Inject(ProvidersName.REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  async get(prefix: string, key: string): Promise<string | null> {
    return this.redisClient.get(`${prefix}:${key}`);
  }

  async set(prefix: string, key: string, value: string): Promise<void> {
    await this.redisClient.set(`${prefix}:${key}`, value);
  }

  async delete(prefix: string, key: string): Promise<void> {
    await this.redisClient.del(`${prefix}:${key}`);
  }

  async setWithExpiry(
    prefix: string,
    key: string,
    value: string,
    expiry: number,
  ): Promise<void> {
    await this.redisClient.set(`${prefix}:${key}`, value, 'EX', expiry);
  }
}
