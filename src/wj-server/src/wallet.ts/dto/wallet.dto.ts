import { IsEmail, IsInt, IsString } from 'class-validator';
import { isFloat } from 'validator';

export class CreateWalletDto {
  @IsEmail()
  email?: string;

  @IsString()
  name: string;

  balance?: number;
}
