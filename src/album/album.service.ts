import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IAlbum } from 'src/types/album';
import { validate, v4 as uuid } from 'uuid';
import { CreateAlbumDto } from './dto/createAlbum.dto';
import { UpdateAlbumDto } from './dto/updateAlbum.dto';
import { addId } from 'src/common/utils/addId';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AlbumService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<IAlbum[]> {
    return this.prisma.album.findMany();
  }

  async getAlbumById(id: string): Promise<IAlbum> {
    if (!validate(id))
      throw new BadRequestException(
        'Bad request. albumId is invalid (not uuid)',
      );
    const album = await this.prisma.album.findUnique({
      where: { id },
    });
    if (!album) throw new NotFoundException('Album was not found');
    return album;
  }

  async createAlbum(dto: CreateAlbumDto): Promise<IAlbum> {
    const artistId = await addId(dto.artistId, 'artist', this.prisma);

    const album = await this.prisma.album.create({
      data: {
        id: uuid(),
        name: dto.name,
        year: dto.year,
        artistId,
      },
    });
    return album;
  }

  async updateAlbum(id: string, dto: UpdateAlbumDto): Promise<IAlbum> {
    await this.getAlbumById(id);

    const artistId =
      dto.artistId !== undefined
        ? await addId(dto.artistId, 'artist', this.prisma)
        : undefined;

    const album = await this.prisma.album.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.year && { year: dto.year }),
        ...(artistId !== undefined && { artistId }),
      },
    });
    return album;
  }

  async deleteAlbum(id: string): Promise<void> {
    await this.getAlbumById(id);

    await this.prisma.track.updateMany({
      where: { albumId: id },
      data: { albumId: null },
    });

    await this.prisma.album.delete({
      where: { id },
    });
  }
}
