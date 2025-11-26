import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ArtistService } from './artist.service';
import { CreateArtistDto } from './dto/createArtist.dto';
import { UpdateArtistDto } from './dto/updateArtist.dto';

@Controller('artist')
export class ArtistController {
  constructor(private readonly artistService: ArtistService) {}

  @Get()
  getAll() {
    return this.artistService.getAll();
  }

  @Get(':id')
  getTrackById(@Param('id') id: string) {
    return this.artistService.getArtistById(id);
  }

  @Post()
  createTrack(@Body() dto: CreateArtistDto) {
    return this.artistService.createArtist(dto);
  }

  @Put(':id')
  updateTrack(@Param('id') id: string, @Body() dto: UpdateArtistDto) {
    return this.artistService.updateArtist(id, dto);
  }

  @Delete(':id')
  deleteTrack(@Param('id') id: string) {
    return this.artistService.deleteArtist(id);
  }
}
