import { HttpStatus, Injectable } from '@nestjs/common';
import { User } from 'src/user/interfaces/user.interface';
import { UserService } from 'src/user/user.service';
import { ReturnInterface } from 'src/utils/return.interface';

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async register(googleToken): Promise<ReturnInterface> {
    const ticket = await client.verifyIdToken({
      idToken: googleToken.token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const user: User = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
    const findUserResult = await this.userService.findUser(user.email);
    if (findUserResult.length !== 0) {
      if (findUserResult[0]['error']) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: findUserResult[0]['error'],
        };
      }
      return {
        status: HttpStatus.OK,
        message: 'User already exists',
      };
    }
    const createUserResult = await this.userService.createUser(user);
    if (createUserResult.affectedRows) {
      return {
        status: HttpStatus.CREATED,
        message: null,
      };
    } else {
      return { status: HttpStatus.NOT_MODIFIED, message: 'Create user fail' };
    }
  }
}
