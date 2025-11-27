import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { artistDataBase } from 'src/common/db';
import { IArtist } from 'src/types/artist';
import { validate, v4 as uuid } from 'uuid';
import { CreateArtistDto } from './dto/createArtist.dto';
import { UpdateArtistDto } from './dto/updateArtist.dto';
import { deleteArtistId } from 'src/common/utils/deleteArtistId';

@Injectable()
export class ArtistService {
  getAll(): IArtist[] {
    return artistDataBase;
  }

  getArtistById(id: string): IArtist {
    if (!validate(id))
      throw new BadRequestException(
        'Bad request. artistId is invalid (not uuid)',
      );
    const artist = artistDataBase.find((artist) => artist.id === id);
    if (!artist) throw new NotFoundException('Artist was not found');
    return artist;
  }

  createArtist(dto: CreateArtistDto) {
    const artist: IArtist = {
      id: uuid(),
      name: dto.name,
      grammy: dto.grammy,
    };
    artistDataBase.push(artist);
    return { message: 'Successful operation' };
  }

  updateArtist(id: string, dto: UpdateArtistDto) {
    const artist = this.getArtistById(id);
    if (dto.name) artist.name = dto.name;
    if (dto.grammy !== undefined) artist.grammy = dto.grammy;
    return { message: 'The artist has been updated' };
  }

  deleteArtist(id: string) {
    this.getArtistById(id);
    const artistIndex = artistDataBase.findIndex((artist) => artist.id === id);
    artistDataBase.splice(artistIndex, 1);
    deleteArtistId(id);
    return { message: 'Deleted successfully' };
  }
}
