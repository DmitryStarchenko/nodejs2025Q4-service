import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateTrackDto {
  @IsNotEmpty({ message: 'The name field is required' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  artistId: string;

  @IsOptional()
  @IsString()
  albumId: string;

  @IsNotEmpty({ message: 'The name field is required' })
  @IsNumber()
  @IsPositive()
  @IsInt({ message: 'The duration field must be an integer' })
  duration: number;
}
