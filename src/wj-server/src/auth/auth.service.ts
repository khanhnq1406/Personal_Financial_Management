import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async register(googleToken) {
    const ticket = await client.verifyIdToken({
      idToken: googleToken.token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const findUserResult = await this.userService.findUser(email);
    if (findUserResult.length !== 0) {
      if (findUserResult[0]['error']) {
        return findUserResult[0];
      }
    }
    if (findUserResult.length === 0) {
      console.log('Create account');
    }
    return payload;
  }
}
