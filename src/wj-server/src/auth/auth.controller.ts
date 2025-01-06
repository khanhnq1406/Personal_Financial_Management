import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard)
  @Get()
  async auth() {
    return { status: HttpStatus.OK };
  }

  @Post('register')
  async register(@Body() googleToken: any) {
    return this.authService.register(googleToken);
  }

  @Post('login')
  async login(@Body() googleToken: any) {
    return this.authService.login(googleToken);
  }

  @Post('logout')
  async logout(@Body() jwtToken: any, @Res() res: Response) {
    return this.authService.logout(jwtToken, res);
  }

  @Get('test')
  async test() {
    return await this.authService.redisTesting();
  }
}
