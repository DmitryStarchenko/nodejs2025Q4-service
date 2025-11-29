import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateArtistDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsOptional()
  @IsBoolean()
  grammy: boolean;
}
