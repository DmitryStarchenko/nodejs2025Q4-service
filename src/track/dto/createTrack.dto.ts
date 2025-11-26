import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateTrackDto {
  @IsNotEmpty({ message: 'Bad request. body does not contain required fields' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  artistId: string;

  @IsOptional()
  @IsString()
  albumId: string;

  @IsNotEmpty({ message: 'Bad request. body does not contain required fields' })
  @IsNumber()
  @IsPositive()
  @IsInt({ message: 'The duration field must be an integer' })
  duration: number;
}
