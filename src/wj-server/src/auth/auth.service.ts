import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { User } from 'src/user/interfaces/user.interface';
import { UserService } from 'src/user/user.service';
import { RedisRepository } from 'src/database/redis.repository';
import { redisExpiry, redisPrefix } from 'src/utils/constants';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private redis: RedisRepository,
  ) {}

  async register(googleToken: { token: string }) {
    try {
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
          throw new BadRequestException(findUserResult[0]['error']);
        }
        return {
          message: 'User already exists',
          data: { email: user.email },
        };
      }

      const createUserResult = await this.userService.createUser(user);
      if (!createUserResult.affectedRows) {
        throw new BadRequestException('Failed to create user');
      }

      return {
        message: 'User registered successfully',
        data: { email: user.email },
      };
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`);
      throw error;
    }
  }

  async login(googleToken: { token: string }) {
    try {
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
        throw new NotFoundException('User not found. Please register first.');
      }
      if (findUserResult[0]['error']) {
        throw new BadRequestException(findUserResult[0]['error']);
      }

      const jwtPayload = {
        sub: findUserResult[0]['id'],
        email: findUserResult[0]['email'],
        userId: findUserResult[0]['id'],
      };

      const token = await this.jwtService.signAsync(jwtPayload);
      await this.redis.setWithExpiry(
        redisPrefix.WhiteList,
        findUserResult[0]['email'],
        token,
        redisExpiry,
      );

      return {
        message: 'Login successful',
        data: {
          accessToken: token,
          email: findUserResult[0]['email'],
          fullname: findUserResult[0]['name'],
          picture: findUserResult[0]['picture'],
        },
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);
      throw error;
    }
  }

  async logout(jwtToken: { token: string }) {
    try {
      const decoded = await this.jwtService.verifyAsync(jwtToken.token);
      const isDeleted = await this.redis.delete(
        redisPrefix.WhiteList,
        decoded.email,
      );

      if (!isDeleted) {
        throw new BadRequestException('Failed to logout');
      }

      return { message: 'Logged out successfully' };
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  async auth(email: string) {
    try {
      const findUserResult = await this.userService.findUser(email);
      if (findUserResult.length === 0) {
        throw new NotFoundException('User not found');
      }
      if (findUserResult[0]['error']) {
        throw new BadRequestException(findUserResult[0]['error']);
      }

      return {
        message: 'User retrieved successfully',
        data: findUserResult[0],
      };
    } catch (error) {
      this.logger.error(`Auth check failed: ${error.message}`);
      throw error;
    }
  }

  async redisTesting() {
    this.logger.debug('Redis: ', await this.redis.get('test', '*'));
    return { message: 'Redis test completed' };
  }
}
