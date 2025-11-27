import { albumDataBase, trackDataBase } from '../db';

export const deleteArtistId = (id: string) => {
  trackDataBase.forEach((track) => {
    if (track.artistId === id) track.artistId = null;
  });
  albumDataBase.forEach((album) => {
    if (album.artistId === id) album.artistId = null;
  });
};
