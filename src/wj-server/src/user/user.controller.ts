import { Controller, Get, Inject, Query } from '@nestjs/common';
import { UserService } from './user.service';
// import { Param } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getUser(@Query() param: string[]): {} {
    console.log(param);

    return this.userService.getUser();
  }
}
