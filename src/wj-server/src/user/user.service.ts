import { Inject, Injectable } from '@nestjs/common';
import { ProvidersName } from 'src/constants';
import { DataSource } from 'typeorm';
import { isEmail } from 'class-validator';
import { UserDto } from './dto/user.dto';

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

  async findUser(email: string): Promise<{}[]> {
    if (!isEmail(email)) {
      return [
        {
          error: 'Invalid email',
        },
      ];
    }
    return await this.dataSource.query(
      `
      SELECT * FROM user
      WHERE email = ?
      `,
      [email],
    );
  }
}