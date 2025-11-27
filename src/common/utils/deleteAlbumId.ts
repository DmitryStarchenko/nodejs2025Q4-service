import { trackDataBase } from '../db';

export const deleteAlbumId = (id: string) => {
  trackDataBase.forEach((track) => {
    if (track.albumId === id) track.albumId = null;
  });
};
