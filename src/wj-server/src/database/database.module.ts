import { Module } from '@nestjs/common';
import { databaseProviders } from './database.provider';
import { redisClientProvider, redisOption } from './redis.provider';
import { RedisRepository } from './redis.repository';

@Module({
  providers: [
    ...databaseProviders,
    redisOption,
    ...redisClientProvider,
    RedisRepository,
  ],
  exports: [...databaseProviders, ...redisClientProvider, RedisRepository],
})
export class DatabaseModule {}
