import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { favoriteDataBase, trackDataBase } from 'src/common/db';
import { ITrack } from 'src/types/track';
import { validate, v4 as uuid } from 'uuid';
import { CreateTrackDto } from './dto/createTrack.dto';
import { UpdateTrackDto } from './dto/updateTrack.dto';
import { addId } from 'src/common/utils/addId';

@Injectable()
export class TrackService {
  getAll(): ITrack[] {
    return trackDataBase;
  }

  getTrackById(id: string): ITrack {
    if (!validate(id))
      throw new BadRequestException(
        'Bad request. trackId is invalid (not uuid)',
      );
    const track = trackDataBase.find((track) => track.id === id);
    if (!track) throw new NotFoundException('Track was not found');
    return track;
  }

  createTrack(dto: CreateTrackDto): ITrack {
    const track: ITrack = {
      id: uuid(),
      name: dto.name,
      artistId: addId(dto.artistId),
      albumId: addId(dto.albumId),
      duration: dto.duration,
    };
    trackDataBase.push(track);
    return track;
  }

  updateTrack(id: string, dto: UpdateTrackDto) {
    const track = this.getTrackById(id);
    if (dto.name) track.name = dto.name;
    if (dto.artistId) track.artistId = dto.artistId;
    if (dto.albumId) track.albumId = dto.albumId;
    if (dto.duration) track.duration = dto.duration;
    return track;
  }

  deleteTrack(id: string): void {
    this.getTrackById(id);
    const trackIndex = trackDataBase.findIndex((track) => track.id === id);
    trackDataBase.splice(trackIndex, 1);
    const favTrackIndex = favoriteDataBase.tracks.findIndex(
      (track) => track.id === id,
    );
    if (favTrackIndex !== -1) {
      favoriteDataBase.tracks.splice(favTrackIndex, 1);
    }
  }
}
