import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateAlbumDto {
  @IsString()
  @IsNotEmpty({ message: 'Bad request. body does not contain required fields' })
  name: string;

  @IsNotEmpty({ message: 'Bad request. body does not contain required fields' })
  @IsNumber()
  @IsPositive()
  @IsInt()
  year: number;

  @IsString()
  @IsOptional()
  artistId: string;
}
