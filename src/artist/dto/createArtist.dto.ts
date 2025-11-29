import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateArtistDto {
  @IsString()
  @IsNotEmpty({ message: 'Bad request. body does not contain required fields' })
  name: string;

  @IsNotEmpty({ message: 'Bad request. body does not contain required fields' })
  @IsBoolean()
  grammy: boolean;
}
