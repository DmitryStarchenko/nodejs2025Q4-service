import { v4 as uuid } from 'uuid';

class MockStorage {
  private users = new Map();
  private albums = new Map();
  private artists = new Map();
  private tracks = new Map();
  private favorites = new Map();

  createUser(data: any) {
    const id = uuid();
    const user = {
      id,
      ...data,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.users.set(id, user);
    return user;
  }

  findUser(id: string) {
    return this.users.get(id) || null;
  }

  updateUser(id: string, data: any) {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = {
      ...user,
      ...data,
      version: user.version + 1,
      updatedAt: Date.now(),
    };
    this.users.set(id, updated);
    return updated;
  }

  deleteUser(id: string) {
    return this.users.delete(id);
  }

  createAlbum(data: any) {
    const id = uuid();
    const album = { id, ...data };
    this.albums.set(id, album);
    return album;
  }

  findAlbum(id: string) {
    return this.albums.get(id) || null;
  }

  updateAlbum(id: string, data: any) {
    const album = this.albums.get(id);
    if (!album) return null;
    const updated = { ...album, ...data };
    this.albums.set(id, updated);
    return updated;
  }

  deleteAlbum(id: string) {
    return this.albums.delete(id);
  }

  createArtist(data: any) {
    const id = uuid();
    const artist = { id, ...data };
    this.artists.set(id, artist);
    return artist;
  }

  findArtist(id: string) {
    return this.artists.get(id) || null;
  }

  updateArtist(id: string, data: any) {
    const artist = this.artists.get(id);
    if (!artist) return null;
    const updated = { ...artist, ...data };
    this.artists.set(id, updated);
    return updated;
  }

  deleteArtist(id: string) {
    return this.artists.delete(id);
  }

  createTrack(data: any) {
    const id = uuid();
    const track = { id, ...data };
    this.tracks.set(id, track);
    return track;
  }

  findTrack(id: string) {
    return this.tracks.get(id) || null;
  }

  updateTrack(id: string, data: any) {
    const track = this.tracks.get(id);
    if (!track) return null;
    const updated = { ...track, ...data };
    this.tracks.set(id, updated);
    return updated;
  }

  deleteTrack(id: string) {
    return this.tracks.delete(id);
  }

  addFavorite(data: any) {
    const id = uuid();
    const favorite = { id, ...data };
    this.favorites.set(id, favorite);
    return favorite;
  }

  findFavorite(query: any) {
    for (const [, fav] of this.favorites) {
      if (query.trackId && fav.trackId === query.trackId) return fav;
      if (query.albumId && fav.albumId === query.albumId) return fav;
      if (query.artistId && fav.artistId === query.artistId) return fav;
    }
    return null;
  }

  deleteFavorite(id: string) {
    return this.favorites.delete(id);
  }

  getAllFavorites() {
    const favs = Array.from(this.favorites.values());
    const tracks = favs
      .filter((f) => f.trackId)
      .map((f) => this.findTrack(f.trackId))
      .filter(Boolean);
    const albums = favs
      .filter((f) => f.albumId)
      .map((f) => this.findAlbum(f.albumId))
      .filter(Boolean);
    const artists = favs
      .filter((f) => f.artistId)
      .map((f) => this.findArtist(f.artistId))
      .filter(Boolean);
    return { tracks, albums, artists };
  }
}

export const mockStorage = new MockStorage();
