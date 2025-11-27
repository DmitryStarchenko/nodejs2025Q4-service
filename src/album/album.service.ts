import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { albumDataBase } from 'src/common/db';
import { IAlbum } from 'src/types/album';
import { validate, v4 as uuid } from 'uuid';
import { CreateAlbumDto } from './dto/createAlbum.dto';
import { UpdateAlbumDto } from './dto/updateAlbum.dto';
import { addId } from 'src/common/utils/addId';
import { deleteAlbumId } from 'src/common/utils/deleteAlbumId';

@Injectable()
export class AlbumService {
  getAll(): IAlbum[] {
    return albumDataBase;
  }

  getAlbumById(id: string): IAlbum {
    if (!validate(id))
      throw new BadRequestException(
        'Bad request. albumId is invalid (not uuid)',
      );
    const album = albumDataBase.find((album) => album.id === id);
    if (!album) throw new NotFoundException('Album was not found');
    return album;
  }

  createAlbum(dto: CreateAlbumDto): IAlbum {
    const album: IAlbum = {
      id: uuid(),
      name: dto.name,
      year: dto.year,
      artistId: addId(dto.artistId),
    };
    albumDataBase.push(album);
    return album;
  }

  updateAlbum(id: string, dto: UpdateAlbumDto): IAlbum {
    const album = this.getAlbumById(id);
    if (dto.name) album.name = dto.name;
    if (dto.year) album.year = dto.year;
    if (dto.artistId) album.artistId = dto.artistId;
    return album;
  }

  deleteAlbum(id: string): void {
    this.getAlbumById(id);
    const albumIndex = albumDataBase.findIndex((album) => album.id === id);
    albumDataBase.splice(albumIndex, 1);
    deleteAlbumId(id);
  }
}
