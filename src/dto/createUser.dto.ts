import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Login is required' })
  @IsString()
  login: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password: string;
}
