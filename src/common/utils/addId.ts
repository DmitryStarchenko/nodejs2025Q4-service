import { PrismaService } from 'src/prisma/prisma.service';

export const addId = async (
  id: string | null | undefined,
  type: 'artist' | 'album',
  prisma: PrismaService,
): Promise<string | null> => {
  if (!id) {
    return null;
  }

  try {
    if (type === 'artist') {
      const artist = await prisma.artist.findUnique({ where: { id } });
      return artist ? id : null;
    }

    if (type === 'album') {
      const album = await prisma.album.findUnique({ where: { id } });
      return album ? id : null;
    }
  } catch {
    return id;
  }

  return null;
};
