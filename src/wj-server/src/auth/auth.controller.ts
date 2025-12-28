import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from '../common/decorators/api-response.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard)
  @Get()
  async auth(@CurrentUser() user: { userId: number; email: string }) {
    return await this.authService.auth(user.email);
  }

  @Post('register')
  async register(@Body() googleToken: { token: string }) {
    return await this.authService.register(googleToken);
  }

  @Post('login')
  async login(@Body() googleToken: { token: string }) {
    return await this.authService.login(googleToken);
  }

  @Post('logout')
  async logout(@Body() jwtToken: { token: string }) {
    return await this.authService.logout(jwtToken);
  }

  @Get('test')
  async test() {
    return await this.authService.redisTesting();
  }
}
