import { ProvidersName } from 'src/utils/constants';
import { DataSource } from 'typeorm';

export const databaseProviders = [
  {
    provide: ProvidersName.DATA_SOURCE,
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'wealthjourney',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true,
      });
      return dataSource.initialize();
    },
  },
];
