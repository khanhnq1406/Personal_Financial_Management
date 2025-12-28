import { ProvidersName, redisUrl } from 'src/utils/constants';
import { createClient } from 'redis';

export const redisOption = {
  provide: ProvidersName.REDIS_OPTIONS,
  useValue: { url: redisUrl },
};

export const redisClientProvider = [
  {
    inject: [ProvidersName.REDIS_OPTIONS],
    provide: ProvidersName.REDIS_CLIENT,
    useFactory: async (options: { url: string }) => {
      const client = await createClient(options);
      await client.connect();
      return client;
    },
  },
];
