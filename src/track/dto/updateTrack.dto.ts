import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

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
  @IsNumber()
  @IsInt({ message: 'The duration field must be an integer' })
  duration: number;
}
