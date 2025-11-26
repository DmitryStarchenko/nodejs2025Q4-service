import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { trackDataBase } from 'src/common/db';
import { ITrack } from 'src/types/track';
import { validate, v4 as uuid } from 'uuid';
import { CreateTrackDto } from './dto/createTrack.dto';
import { UpdateTrackDto } from './dto/updateTrack.dto';

@Injectable()
export class TrackService {
  getAll(): ITrack[] {
    return trackDataBase;
  }

  getTrackById(id: string): ITrack {
    if (!validate(id)) throw new BadRequestException('ID not UUID');
    const track = trackDataBase.find((user) => user.id === id);
    if (!track) throw new NotFoundException('This track does not exist');
    return track;
  }

  createTrack(dto: CreateTrackDto) {
    const track: ITrack = {
      id: uuid(),
      name: dto.name,
      artistId: dto.artistId ? dto.artistId : null,
      albumId: dto.albumId ? dto.albumId : null,
      duration: dto.duration,
    };
    trackDataBase.push(track);
    return { message: 'Track created' };
  }

  updateTrack(id: string, dto: UpdateTrackDto) {
    const track = this.getTrackById(id);
    if (dto.name) track.name = dto.name;
    if (dto.artistId) track.artistId = dto.artistId;
    if (dto.albumId) track.albumId = dto.albumId;
    if (dto.duration) track.duration = dto.duration;
    return { message: 'Track updated' };
  }

  deleteTrack(id: string) {
    this.getTrackById(id);
    const trackIndex = trackDataBase.findIndex((track) => track.id === id);
    trackDataBase.splice(trackIndex, 1);
    return { message: 'Track deleted' };
  }
}
