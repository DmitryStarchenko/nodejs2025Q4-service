import { albumDataBase, favoriteDataBase, trackDataBase } from '../db';

export const deleteArtistId = (id: string) => {
  trackDataBase.forEach((track) => {
    if (track.artistId === id) track.artistId = null;
  });
  albumDataBase.forEach((album) => {
    if (album.artistId === id) album.artistId = null;
  });
  const artistIndex = favoriteDataBase.artists.findIndex(
    (artist) => artist.id === id,
  );
  if (artistIndex !== -1) {
    favoriteDataBase.artists.splice(artistIndex, 1);
  }
};
