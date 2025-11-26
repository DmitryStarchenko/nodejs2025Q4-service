import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateTrackDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  artistId: string;

  @IsOptional()
  @IsString()
  albumId: string;

  @IsOptional()
  @IsPositive()
  @IsNumber()
  @IsInt({ message: 'The duration field must be an integer' })
  duration: number;
}
