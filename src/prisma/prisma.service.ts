import { Injectable } from '@nestjs/common';

/* eslint-disable @typescript-eslint/no-unused-vars */
const mockMethods = {
  findMany: (_args?: any) => [],
  findFirst: (_args?: any) => null,
  findUnique: (_args?: any) => null,
  create: (args?: any) => ({ id: 'mock-id', ...args?.data }),
  update: (args?: any) => ({ id: args?.where?.id, ...args?.data }),
  updateMany: (_args?: any) => ({ count: 0 }),
  delete: (args?: any) => ({ id: args?.where?.id }),
  deleteMany: (_args?: any) => ({ count: 0 }),
};

@Injectable()
export class PrismaService {
  user = mockMethods;
  album = mockMethods;
  artist = mockMethods;
  track = mockMethods;
  favorite = mockMethods;
}
