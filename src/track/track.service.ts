import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ITrack } from 'src/types/track';
import { validate, v4 as uuid } from 'uuid';
import { CreateTrackDto } from './dto/createTrack.dto';
import { UpdateTrackDto } from './dto/updateTrack.dto';
import { addId } from 'src/common/utils/addId';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoggingService } from 'src/logging/logging.service';
import { mockStorage } from 'src/common/utils/mockStorage';

@Injectable()
export class TrackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: LoggingService,
  ) {}

  async getAll(): Promise<ITrack[]> {
    try {
      return await this.prisma.track.findMany();
    } catch {
      return Array.from((mockStorage as any).tracks.values());
    }
  }

  async getTrackById(id: string): Promise<ITrack> {
    try {
      if (!validate(id)) {
        this.loggingService.error(
          `Invalid UUID provided for getTrackById: ${id}`,
          undefined,
          'TrackService',
        );
        throw new BadRequestException(
          'Bad request. trackId is invalid (not uuid)',
        );
      }

      const track = await this.prisma.track.findUnique({ where: { id } });
      if (!track) throw new NotFoundException('Track was not found');
      return track;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        const mockTrack = mockStorage.findTrack(id);
        if (mockTrack) return mockTrack;
        throw error;
      }
      const mockTrack = mockStorage.findTrack(id);
      if (!mockTrack) throw new NotFoundException('Track was not found');
      return mockTrack;
    }
  }

  async createTrack(dto: CreateTrackDto): Promise<ITrack> {
    try {
      const artistId = await addId(dto.artistId, 'artist', this.prisma);
      const albumId = await addId(dto.albumId, 'album', this.prisma);
      const track = await this.prisma.track.create({
        data: {
          id: uuid(),
          name: dto.name,
          artistId,
          albumId,
          duration: dto.duration,
        },
      });
      return track;
    } catch {
      return mockStorage.createTrack(dto);
    }
  }

  async updateTrack(id: string, dto: UpdateTrackDto): Promise<ITrack> {
    try {
      await this.getTrackById(id);
      const artistId =
        dto.artistId !== undefined
          ? await addId(dto.artistId, 'artist', this.prisma)
          : undefined;
      const albumId =
        dto.albumId !== undefined
          ? await addId(dto.albumId, 'album', this.prisma)
          : undefined;
      const track = await this.prisma.track.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(artistId !== undefined && { artistId }),
          ...(albumId !== undefined && { albumId }),
          ...(dto.duration && { duration: dto.duration }),
        },
      });
      return track;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const updated = mockStorage.updateTrack(id, dto);
      if (!updated) {
        throw new NotFoundException('Track was not found');
      }
      return updated;
    }
  }

  async deleteTrack(id: string): Promise<void> {
    try {
      await this.getTrackById(id);
      await this.prisma.track.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      mockStorage.deleteTrack(id);
    }
  }
}
