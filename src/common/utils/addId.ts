import { albumDataBase, artistDataBase } from '../db';

export const addId = (id: string) => {
  const artist = artistDataBase.find((artist) => artist.id === id);
  const album = albumDataBase.find((album) => album.id === id);

  if (artist || album) {
    return id;
  }
  return null;
};
