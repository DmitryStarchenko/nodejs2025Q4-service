import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { IUser } from 'src/types/user';
import { validate, v4 as uuid } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoggingService } from 'src/logging/logging.service';
import { mockStorage } from 'src/common/utils/mockStorage';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: LoggingService,
  ) {}

  async getAll(): Promise<IUser[]> {
    try {
      const users = await this.prisma.user.findMany();
      return users.map((user) => ({
        ...user,
        createdAt: Number(user.createdAt),
        updatedAt: Number(user.updatedAt),
      }));
    } catch (error) {
      return Array.from((mockStorage as any).users.values());
    }
  }

  async getUserById(id: string): Promise<IUser> {
    try {
      if (!validate(id)) {
        this.loggingService.error(
          `Invalid UUID provided for getUserById: ${id}`,
          undefined,
          'UserService',
        );
        throw new BadRequestException(
          'Bad request. userId is invalid (not uuid)',
        );
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        ...user,
        createdAt: Number(user.createdAt),
        updatedAt: Number(user.updatedAt),
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        if (error instanceof NotFoundException) {
          const mockUser = mockStorage.findUser(id);
          if (mockUser) return mockUser;
        }
        throw error;
      }
      const mockUser = mockStorage.findUser(id);
      if (!mockUser) {
        throw new NotFoundException('User not found');
      }
      return mockUser;
    }
  }

  async createUser(dto: CreateUserDto): Promise<IUser> {
    try {
      const now = BigInt(Date.now());
      const user = await this.prisma.user.create({
        data: {
          id: uuid(),
          login: dto.login,
          password: dto.password,
          version: 1,
          createdAt: now,
          updatedAt: now,
        },
      });

      return {
        ...user,
        createdAt: Number(user.createdAt),
        updatedAt: Number(user.updatedAt),
      };
    } catch (error) {
      return mockStorage.createUser(dto);
    }
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<IUser> {
    if (!validate(id)) {
      throw new BadRequestException(
        'Bad request. userId is invalid (not uuid)',
      );
    }
    try {
      const user = await this.getUserById(id);
      if (user.password !== dto.oldPassword) {
        throw new ForbiddenException('oldPassword is wrong');
      }
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          password: dto.newPassword,
          version: user.version + 1,
          updatedAt: BigInt(Date.now()),
        },
      });
      return {
        ...updatedUser,
        createdAt: Number(updatedUser.createdAt),
        updatedAt: Number(updatedUser.updatedAt),
      };
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      const user = mockStorage.findUser(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (user.password !== dto.oldPassword) {
        throw new ForbiddenException('oldPassword is wrong');
      }
      const updated = mockStorage.updateUser(id, { password: dto.newPassword });
      if (!updated) {
        throw new NotFoundException('User not found');
      }
      return updated;
    }
  }

  async deleteUser(id: string): Promise<void> {
    if (!validate(id)) {
      throw new BadRequestException(
        'Bad request. userId is invalid (not uuid)',
      );
    }
    try {
      await this.getUserById(id);
      await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      mockStorage.deleteUser(id);
    }
  }
}
