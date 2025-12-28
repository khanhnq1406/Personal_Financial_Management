import { IsString, IsNumber } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  name: string;

  @IsNumber()
  balance: number;
}
