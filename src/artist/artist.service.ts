import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IArtist } from 'src/types/artist';
import { validate, v4 as uuid } from 'uuid';
import { CreateArtistDto } from './dto/createArtist.dto';
import { UpdateArtistDto } from './dto/updateArtist.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoggingService } from 'src/logging/logging.service';
import { mockStorage } from 'src/common/utils/mockStorage';

@Injectable()
export class ArtistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: LoggingService,
  ) {}

  async getAll(): Promise<IArtist[]> {
    try {
      return await this.prisma.artist.findMany();
    } catch {
      return Array.from((mockStorage as any).artists.values());
    }
  }

  async getArtistById(id: string): Promise<IArtist> {
    if (!validate(id))
      throw new BadRequestException(
        'Bad request. artistId is invalid (not uuid)',
      );
    try {
      const artist = await this.prisma.artist.findUnique({ where: { id } });
      if (!artist) throw new NotFoundException('Artist was not found');
      return artist;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        const mockArtist = mockStorage.findArtist(id);
        if (mockArtist) return mockArtist;
        throw error;
      }
      const mockArtist = mockStorage.findArtist(id);
      if (!mockArtist) throw new NotFoundException('Artist was not found');
      return mockArtist;
    }
  }

  async createArtist(dto: CreateArtistDto): Promise<IArtist> {
    try {
      const artist = await this.prisma.artist.create({
        data: {
          id: uuid(),
          name: dto.name,
          grammy: dto.grammy,
        },
      });
      return artist;
    } catch {
      return mockStorage.createArtist(dto);
    }
  }

  async updateArtist(id: string, dto: UpdateArtistDto): Promise<IArtist> {
    try {
      await this.getArtistById(id);
      const artist = await this.prisma.artist.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.grammy !== undefined && { grammy: dto.grammy }),
        },
      });
      return artist;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const updated = mockStorage.updateArtist(id, dto);
      if (!updated) {
        throw new NotFoundException('Artist was not found');
      }
      return updated;
    }
  }

  async deleteArtist(id: string): Promise<void> {
    try {
      await this.getArtistById(id);
      await this.prisma.track.updateMany({
        where: { artistId: id },
        data: { artistId: null },
      });
      await this.prisma.album.updateMany({
        where: { artistId: id },
        data: { artistId: null },
      });
      await this.prisma.artist.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      for (const [trackId, track] of (mockStorage as any).tracks) {
        if (track.artistId === id) {
          mockStorage.updateTrack(trackId, { ...track, artistId: null });
        }
      }
      for (const [albumId, album] of (mockStorage as any).albums) {
        if (album.artistId === id) {
          mockStorage.updateAlbum(albumId, { ...album, artistId: null });
        }
      }
      mockStorage.deleteArtist(id);
    }
  }
}
