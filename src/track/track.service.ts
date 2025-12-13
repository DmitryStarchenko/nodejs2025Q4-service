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

@Injectable()
export class TrackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: LoggingService,
  ) {}

  async getAll(): Promise<ITrack[]> {
    return this.prisma.track.findMany();
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

      const track = await this.prisma.track.findUnique({
        where: { id },
      });

      if (!track) {
        this.loggingService.error(
          `Track not found with id: ${id}`,
          undefined,
          'TrackService',
        );
        throw new NotFoundException('Track was not found');
      }

      return track;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.loggingService.error(
        `Unexpected error in getTrackById for id: ${id}`,
        error instanceof Error ? error.stack : String(error),
        'TrackService',
      );
      throw error;
    }
  }

  async createTrack(dto: CreateTrackDto): Promise<ITrack> {
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
  }

  async updateTrack(id: string, dto: UpdateTrackDto): Promise<ITrack> {
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
  }

  async deleteTrack(id: string): Promise<void> {
    await this.getTrackById(id);
    await this.prisma.track.delete({
      where: { id },
    });
  }
}
