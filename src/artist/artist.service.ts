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

@Injectable()
export class ArtistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: LoggingService,
  ) {}

  async getAll(): Promise<IArtist[]> {
    return this.prisma.artist.findMany();
  }

  async getArtistById(id: string): Promise<IArtist> {
    if (!validate(id))
      throw new BadRequestException(
        'Bad request. artistId is invalid (not uuid)',
      );
    const artist = await this.prisma.artist.findUnique({
      where: { id },
    });
    if (!artist) throw new NotFoundException('Artist was not found');
    return artist;
  }

  async createArtist(dto: CreateArtistDto): Promise<IArtist> {
    const artist = await this.prisma.artist.create({
      data: {
        id: uuid(),
        name: dto.name,
        grammy: dto.grammy,
      },
    });
    return artist;
  }

  async updateArtist(id: string, dto: UpdateArtistDto): Promise<IArtist> {
    await this.getArtistById(id);
    const artist = await this.prisma.artist.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.grammy !== undefined && { grammy: dto.grammy }),
      },
    });
    return artist;
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

      await this.prisma.artist.delete({
        where: { id },
      });

      this.loggingService.log(
        `Artist deleted successfully: ${id}`,
        'ArtistService',
      );
    } catch (error) {
      this.loggingService.error(
        `Error deleting artist with id: ${id}`,
        error instanceof Error ? error.stack : String(error),
        'ArtistService',
      );
      throw error;
    }
  }
}
