import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

  async createWallet(wallet: CreateWalletDto, email: string) {
    const { name, balance } = wallet;
    const user = await this.userService.findUser(email);

    if (!user || user.length === 0) {
      throw new NotFoundException('User not found');
    }

    const userId = user[0]['id'];

    const result = await this.dataSource.query(
      `
      INSERT INTO wallet (wallet_name, balance, user_id)
      VALUES (?,?,?)
      `,
      [name, balance || 0, userId],
    );

    if (!result.affectedRows || result.affectedRows === 0) {
      throw new BadRequestException('Failed to create wallet');
    }

    return {
      message: 'Wallet created successfully',
      data: {
        id: result.insertId,
        name,
        balance: balance || 0,
        userId,
      },
    };
  }

  async listWallets(userId: number) {
    console.log('userID', userId);
    const wallets = await this.dataSource.query(
      `
      SELECT id, wallet_name, balance, user_id, created_at, updated_at
      FROM wallet
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId],
    );

    return {
      message: 'Wallets retrieved successfully',
      data: wallets,
    };
  }
}
