import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpStatus,
} from '@nestjs/common';
import { CreateWalletDto } from './dto/wallet.dto';
import { WalletService } from './wallet.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../common/decorators/api-response.decorator';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(AuthGuard)
  @Post('create')
  async createWallet(
    @Body() createWalletDto: CreateWalletDto,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    const result = await this.walletService.createWallet(
      createWalletDto,
      user.email,
    );

    return {
      statusCode: HttpStatus.CREATED,
      ...result,
    };
  }

  @UseGuards(AuthGuard)
  @Get('list')
  async listWallets(@CurrentUser() user: { userId: number; email: string }) {
    return await this.walletService.listWallets(user.userId);
  }
}
