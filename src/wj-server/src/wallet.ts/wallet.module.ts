import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [DatabaseModule, UserModule],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
