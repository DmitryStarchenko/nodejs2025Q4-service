import { IAlbum } from './album';
import { IArtist } from './artist';
import { ITrack } from './track';

export interface IFavorites {
  artists: IArtist[];
  albums: IAlbum[];
  tracks: ITrack[];
}
