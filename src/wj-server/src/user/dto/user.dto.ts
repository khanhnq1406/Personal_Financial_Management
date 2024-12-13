import { IsEmail, IsNotEmpty, IsInt, IsString, IsUrl } from 'class-validator';

export class UserDto {
  @IsInt()
  id?: number;

  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsUrl()
  picture: string;
}
