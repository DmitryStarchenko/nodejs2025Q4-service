import { favoriteDataBase, trackDataBase } from '../db';

export const deleteAlbumId = (id: string) => {
  trackDataBase.forEach((track) => {
    if (track.albumId === id) track.albumId = null;
  });
  const albumIndex = favoriteDataBase.albums.findIndex(
    (album) => album.id === id,
  );
  if (albumIndex !== -1) {
    favoriteDataBase.albums.splice(albumIndex, 1);
  }
};
