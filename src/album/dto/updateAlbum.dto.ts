import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateAlbumDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @IsInt()
  year: number;

  @IsString()
  @IsOptional()
  artistId: string;
}
