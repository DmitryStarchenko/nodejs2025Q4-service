import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Bad request. body does not contain required fields' })
  @IsString()
  login: string;

  @IsNotEmpty({ message: 'Bad request. body does not contain required fields' })
  @IsString()
  password: string;
}
