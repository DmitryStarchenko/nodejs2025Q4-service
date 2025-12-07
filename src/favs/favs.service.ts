import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { IFavorites } from 'src/types/favs';
import { validate } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FavsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<IFavorites> {
    const favorites = await this.prisma.favorite.findMany();

    const trackIds = favorites
      .filter((fav) => fav.trackId)
      .map((fav) => fav.trackId);
    const albumIds = favorites
      .filter((fav) => fav.albumId)
      .map((fav) => fav.albumId);
    const artistIds = favorites
      .filter((fav) => fav.artistId)
      .map((fav) => fav.artistId);

    const [tracks, albums, artists] = await Promise.all([
      this.prisma.track.findMany({ where: { id: { in: trackIds } } }),
      this.prisma.album.findMany({ where: { id: { in: albumIds } } }),
      this.prisma.artist.findMany({ where: { id: { in: artistIds } } }),
    ]);

    return { tracks, albums, artists };
  }

  async addTrack(id: string) {
    if (!validate(id))
      throw new BadRequestException('Bad. trackId is invalid (not uuid)');

    const track = await this.prisma.track.findUnique({ where: { id } });
    if (!track)
      throw new UnprocessableEntityException("Track with id doesn't exist");

    await this.prisma.favorite.create({
      data: { trackId: id },
    });

    return { message: 'Added successfully' };
  }

  async deleteTrack(id: string): Promise<void> {
    if (!validate(id))
      throw new BadRequestException('Bad. trackId is invalid (not uuid)');

    const favorite = await this.prisma.favorite.findFirst({
      where: { trackId: id },
    });

    if (!favorite) throw new NotFoundException('Track was not found');

    await this.prisma.favorite.delete({
      where: { id: favorite.id },
    });
  }

  async addAlbum(id: string) {
    if (!validate(id))
      throw new BadRequestException('Bad. albumId is invalid (not uuid)');

    const album = await this.prisma.album.findUnique({ where: { id } });
    if (!album)
      throw new UnprocessableEntityException("Album with id doesn't exist");

    await this.prisma.favorite.create({
      data: { albumId: id },
    });

    return { message: 'Added successfully' };
  }

  async deleteAlbum(id: string): Promise<void> {
    if (!validate(id))
      throw new BadRequestException('Bad. albumId is invalid (not uuid)');

    const favorite = await this.prisma.favorite.findFirst({
      where: { albumId: id },
    });

    if (!favorite) throw new NotFoundException('Album was not found');

    await this.prisma.favorite.delete({
      where: { id: favorite.id },
    });
  }

  async addArtist(id: string) {
    if (!validate(id))
      throw new BadRequestException('Bad. artistId is invalid (not uuid)');

    const artist = await this.prisma.artist.findUnique({ where: { id } });
    if (!artist)
      throw new UnprocessableEntityException("Artist with id doesn't exist");

    await this.prisma.favorite.create({
      data: { artistId: id },
    });

    return { message: 'Added successfully' };
  }

  async deleteArtist(id: string): Promise<void> {
    if (!validate(id))
      throw new BadRequestException('Bad. artistId is invalid (not uuid)');

    const favorite = await this.prisma.favorite.findFirst({
      where: { artistId: id },
    });

    if (!favorite) throw new NotFoundException('Artist was not found');

    await this.prisma.favorite.delete({
      where: { id: favorite.id },
    });
  }
}
