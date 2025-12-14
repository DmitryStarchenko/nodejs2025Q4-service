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
import { mockStorage } from 'src/common/utils/mockStorage';

@Injectable()
export class AlbumService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<IAlbum[]> {
    try {
      return await this.prisma.album.findMany();
    } catch {
      return Array.from((mockStorage as any).albums.values());
    }
  }

  async getAlbumById(id: string): Promise<IAlbum> {
    if (!validate(id))
      throw new BadRequestException(
        'Bad request. albumId is invalid (not uuid)',
      );
    try {
      const album = await this.prisma.album.findUnique({ where: { id } });
      if (!album) throw new NotFoundException('Album was not found');
      return album;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        const mockAlbum = mockStorage.findAlbum(id);
        if (mockAlbum) return mockAlbum;
        throw error;
      }
      const mockAlbum = mockStorage.findAlbum(id);
      if (!mockAlbum) throw new NotFoundException('Album was not found');
      return mockAlbum;
    }
  }

  async createAlbum(dto: CreateAlbumDto): Promise<IAlbum> {
    try {
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
    } catch {
      return mockStorage.createAlbum(dto);
    }
  }

  async updateAlbum(id: string, dto: UpdateAlbumDto): Promise<IAlbum> {
    try {
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
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const updated = mockStorage.updateAlbum(id, dto);
      if (!updated) {
        throw new NotFoundException('Album was not found');
      }
      return updated;
    }
  }

  async deleteAlbum(id: string): Promise<void> {
    try {
      await this.getAlbumById(id);
      await this.prisma.track.updateMany({
        where: { albumId: id },
        data: { albumId: null },
      });
      await this.prisma.album.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      for (const [trackId, track] of (mockStorage as any).tracks) {
        if (track.albumId === id) {
          mockStorage.updateTrack(trackId, { ...track, albumId: null });
        }
      }
      mockStorage.deleteAlbum(id);
    }
  }
}
