export enum ProvidersName {
  DATA_SOURCE = 'DATA_SOURCE',
  REDIS_OPTIONS = 'REDIS_OPTIONS',
  REDIS_CLIENT = 'REDIS_CLIENT',
  REDIS_REPOSITORY = 'REDIS_REPOSITORY',
}

export const jwtConstants = {
  secret: process.env.JWT_SECRET,
  expire: '7d',
};

export const redisUrl = process.env.REDIS_URL;

export const redisExpiry = 60 * 60 * 24 * 7; // second * minute * hour * day
export enum redisPrefix {
  WhiteList = 'whitelist',
}
