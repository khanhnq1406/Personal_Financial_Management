import { Inject, Injectable } from '@nestjs/common';
import { ProvidersName } from 'src/utils/constants';
import { DataSource } from 'typeorm';
import { CreateWalletDto } from './dto/wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    @Inject(ProvidersName.DATA_SOURCE)
    private dataSource: DataSource,
  ) {}

  async createWallet(wallet: CreateWalletDto) {
    return wallet;
  }
}
