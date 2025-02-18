import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/interfaces/user.interface';
import { UserService } from 'src/user/user.service';
import { ReturnInterface } from 'src/utils/return.interface';
import { RedisRepository } from 'src/database/redis.repository';
import { redisExpiry, redisPrefix } from 'src/utils/constants';
import { find } from 'rxjs';

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private redis: RedisRepository,
  ) {}

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

  async login(googleToken): Promise<any> {
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
    if (findUserResult.length === 0) {
      return { status: HttpStatus.NOT_FOUND, message: 'User not found' };
    }
    if (findUserResult[0]['error']) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: findUserResult[0]['error'],
      };
    }
    const jwtPayload = {
      sub: findUserResult[0]['id'],
      email: findUserResult[0]['email'],
    };
    const token = await this.jwtService.signAsync(jwtPayload);
    await this.redis.setWithExpiry(
      redisPrefix.WhiteList,
      findUserResult[0]['email'],
      token,
      redisExpiry,
    );
    return {
      status: HttpStatus.OK,
      message: {
        accessToken: token,
        email: findUserResult[0]['email'],
        fullname: findUserResult[0]['name'],
        picture: findUserResult[0]['picture'],
      },
    };
  }

  async logout(jwtToken, res) {
    try {
      console.log(jwtToken);
      const decoded = await this.jwtService.verifyAsync(jwtToken.token);
      console.log(decoded);
      const isDeleted = await this.redis.delete(
        redisPrefix.WhiteList,
        decoded.email,
      );
      if (isDeleted) {
        res.status(HttpStatus.OK).send();
      } else {
        res.status(HttpStatus.BAD_REQUEST).send();
      }
    } catch (error) {
      console.log(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
    }
  }

  async auth(req, res) {
    try {
      const findUserResult = await this.userService.findUser(req.email);
      if (findUserResult.length === 0) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'User not found' });
      }
      if (findUserResult[0]['error']) {
        return res.status(HttpStatus.BAD_REQUEST).send();
      }
      return res.status(HttpStatus.OK).json(findUserResult[0]);
    } catch (error) {
      console.log(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
    }
  }
  async redisTesting(): Promise<any> {
    console.log('Redis: ', await this.redis.get('test', '*'));
    return;
  }
}
