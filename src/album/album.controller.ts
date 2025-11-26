import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { AlbumService } from './album.service';
import { CreateAlbumDto } from './dto/createAlbum.dto';
import { UpdateAlbumDto } from './dto/updateAlbum.dto';

@Controller('album')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Get()
  getAll() {
    return this.albumService.getAll();
  }

  @Get(':id')
  getAlbumById(@Param('id') id: string) {
    return this.albumService.getAlbumById(id);
  }

  @Post()
  createAlbum(@Body() dto: CreateAlbumDto) {
    return this.albumService.createAlbum(dto);
  }

  @Put(':id')
  updateAlbum(@Param('id') id: string, @Body() dto: UpdateAlbumDto) {
    return this.albumService.updateAlbum(id, dto);
  }

  @Delete(':id')
  deleteAlbum(@Param('id') id: string) {
    return this.albumService.deleteAlbum(id);
  }
}
