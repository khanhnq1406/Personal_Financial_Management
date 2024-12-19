import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() googleToken: any) {
    return this.authService.register(googleToken);
  }

  @Post('login')
  async login(@Body() googleToken: any) {
    return this.authService.login(googleToken);
  }

  @Get('test')
  async test() {
    return await this.authService.redisTesting();
  }
}
