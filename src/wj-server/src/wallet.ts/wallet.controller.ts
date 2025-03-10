import { Controller, Post, Body, Request } from '@nestjs/common';
import { CreateWalletDto } from './dto/wallet.dto';
import { WalletService } from './wallet.service';
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}
  @Post()
  async createWallet(
    @Body() createWalletDto: CreateWalletDto,
    @Request() req: any,
  ) {
    console.log(req);
    return await this.walletService.createWallet(createWalletDto);
  }
}
