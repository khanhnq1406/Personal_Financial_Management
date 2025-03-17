import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Res,
} from '@nestjs/common';
import { CreateWalletDto } from './dto/wallet.dto';
import { WalletService } from './wallet.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(AuthGuard)
  @Post('create')
  async createWallet(
    @Body() createWalletDto: CreateWalletDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const data = {
      ...createWalletDto,
      email: req.user.email,
    };
    return await this.walletService.createWallet(data, res);
  }
}
