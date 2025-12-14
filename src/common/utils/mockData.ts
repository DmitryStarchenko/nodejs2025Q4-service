import { v4 as uuid } from 'uuid';

export const createMockUser = (data: any) => ({
  id: uuid(),
  login: data.login || 'mock-login',
  password: data.password || 'mock-password',
  version: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const createMockAlbum = (data: any) => ({
  id: uuid(),
  name: data.name || 'Mock Album',
  year: data.year || 2023,
  artistId: data.artistId || null,
});

export const createMockArtist = (data: any) => ({
  id: uuid(),
  name: data.name || 'Mock Artist',
  grammy: data.grammy || false,
});

export const createMockTrack = (data: any) => ({
  id: uuid(),
  name: data.name || 'Mock Track',
  artistId: data.artistId || null,
  albumId: data.albumId || null,
  duration: data.duration || 180,
});

export const createMockFavorite = (data: any) => ({
  id: uuid(),
  trackId: data.trackId || null,
  albumId: data.albumId || null,
  artistId: data.artistId || null,
});
