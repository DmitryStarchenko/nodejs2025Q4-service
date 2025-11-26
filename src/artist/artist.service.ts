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

@Injectable()
export class ArtistService {
  getAll(): IArtist[] {
    return artistDataBase;
  }

  getArtistById(id: string): IArtist {
    if (!validate(id)) throw new BadRequestException('ID not UUID');
    const artist = artistDataBase.find((artist) => artist.id === id);
    if (!artist) throw new NotFoundException('This artist does not exist');
    return artist;
  }

  createArtist(dto: CreateArtistDto) {
    const artist: IArtist = {
      id: uuid(),
      name: dto.name,
      grammy: dto.grammy,
    };
    artistDataBase.push(artist);
    return { message: 'Artist created' };
  }

  updateArtist(id: string, dto: UpdateArtistDto) {
    const artist = this.getArtistById(id);
    if (dto.name) artist.name = dto.name;
    if (dto.grammy !== undefined) artist.grammy = dto.grammy;
    return { message: 'Artist updated' };
  }

  deleteArtist(id: string) {
    this.getArtistById(id);
    const artistIndex = artistDataBase.findIndex((artist) => artist.id === id);
    artistDataBase.splice(artistIndex, 1);
    return { message: 'Artist deleted' };
  }
}
