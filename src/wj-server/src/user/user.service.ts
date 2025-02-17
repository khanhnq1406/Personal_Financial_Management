import { Inject, Injectable } from '@nestjs/common';
import { ProvidersName } from 'src/utils/constants';
import { DataSource } from 'typeorm';
import { isEmail } from 'class-validator';
import { UserDto } from './dto/user.dto';
import { User } from './interfaces/user.interface';

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
    try {
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
    } catch (error) {
      console.log(error);
      return [
        {
          error: 'Error while searching user',
        },
      ];
    }
  }

  async createUser(user: UserDto) {
    const { email, name, picture } = user;
    return await this.dataSource.query(
      `
      INSERT INTO user (email, name, picture)
      VALUES (?, ?, ?)
      `,
      [email, name, picture],
    );
  }
}
