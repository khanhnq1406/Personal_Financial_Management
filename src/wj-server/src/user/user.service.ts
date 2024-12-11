import { Inject, Injectable } from '@nestjs/common';
import { ProvidersName } from 'src/constants';
import { DataSource } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @Inject(ProvidersName.DATA_SOURCE)
    private dataSource: DataSource,
  ) {}

  async getUser(): Promise<{}> {
    const result = await this.dataSource.query('select * from user;');
    return {
      result,
    };
  }
}
