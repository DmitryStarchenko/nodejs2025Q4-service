import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  albumDataBase,
  artistDataBase,
  favoriteDataBase,
  trackDataBase,
} from 'src/common/db';
import { IFavorites } from 'src/types/favs';
import { validate } from 'uuid';

@Injectable()
export class FavsService {
  getAll(): IFavorites {
    return favoriteDataBase;
  }

  addTrack(id: string) {
    if (!validate(id))
      throw new BadRequestException('Bad. trackId is invalid (not uuid)');
    const track = trackDataBase.find((track) => track.id === id);
    if (!track)
      throw new UnprocessableEntityException("Track with id doesn't exist");
    favoriteDataBase.tracks.push(track);
    return { message: 'Added successfully' };
  }

  deleteTrack(id: string) {
    if (!validate(id))
      throw new BadRequestException('Bad. trackId is invalid (not uuid)');
    const trackIndex = favoriteDataBase.tracks.findIndex(
      (track) => track.id === id,
    );
    if (trackIndex === -1) throw new NotFoundException('Track was not found');
    favoriteDataBase.tracks.splice(trackIndex, 1);
    return { message: 'Deleted successfully' };
  }

  addAlbum(id: string) {
    if (!validate(id))
      throw new BadRequestException('Bad. albumId is invalid (not uuid)');
    const album = albumDataBase.find((album) => album.id === id);
    if (!album)
      throw new UnprocessableEntityException("Album with id doesn't exist");
    favoriteDataBase.albums.push(album);
    return { message: 'Added successfully' };
  }

  deleteAlbum(id: string) {
    if (!validate(id))
      throw new BadRequestException('Bad. albumId is invalid (not uuid)');
    const albumIndex = favoriteDataBase.albums.findIndex(
      (album) => album.id === id,
    );
    if (albumIndex === -1) throw new NotFoundException('Album was not found');
    favoriteDataBase.albums.splice(albumIndex, 1);
    return { message: 'Deleted successfully' };
  }

  addArtist(id: string) {
    if (!validate(id))
      throw new BadRequestException('Bad. artistId is invalid (not uuid)');
    const artist = artistDataBase.find((artist) => artist.id === id);
    if (!artist)
      throw new UnprocessableEntityException("Artist with id doesn't exist");
    favoriteDataBase.artists.push(artist);
    return { message: 'Added successfully' };
  }

  deleteArtist(id: string) {
    if (!validate(id))
      throw new BadRequestException('Bad. artistId is invalid (not uuid)');
    const artistIndex = favoriteDataBase.artists.findIndex(
      (artist) => artist.id === id,
    );
    if (artistIndex === -1) throw new NotFoundException('Artist was not found');
    favoriteDataBase.artists.splice(artistIndex, 1);
    return { message: 'Deleted successfully' };
  }
}
