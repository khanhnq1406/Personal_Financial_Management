import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ProvidersName } from 'src/utils/constants';
import { DataSource } from 'typeorm';
import { CreateWalletDto } from './dto/wallet.dto';
import { UserService } from '../user/user.service';
@Injectable()
export class WalletService {
  constructor(
    @Inject(ProvidersName.DATA_SOURCE)
    private dataSource: DataSource,
    private userService: UserService,
  ) {}

  async createWallet(wallet: CreateWalletDto, res) {
    const { name, balance, email } = wallet;
    const user = await this.userService.findUser(email);
    if (!user) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: 'User not found' });
    } else {
      const userId = user[0]['id'];

      const wallet = await this.dataSource.query(
        `
        INSERT INTO wallet (wallet_name, balance, user_id)
        VALUES (?,?,?)
        `,
        [name, balance, userId],
      );

      if (!wallet.affectedRows) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'Create wallet fail' });
      }

      return res.status(HttpStatus.CREATED).send();
    }
  }
}
