import { IAlbum } from 'src/types/album';
import { IArtist } from 'src/types/artist';
import { IFavorites } from 'src/types/favs';
import { ITrack } from 'src/types/track';
import { IUser } from 'src/types/user';

export const userDataBase: IUser[] = [];
export const trackDataBase: ITrack[] = [];
export const artistDataBase: IArtist[] = [];
export const albumDataBase: IAlbum[] = [];
export const favoriteDataBase: IFavorites = {
  artists: [],
  albums: [],
  tracks: [],
};
