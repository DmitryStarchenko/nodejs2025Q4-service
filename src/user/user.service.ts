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
      this.loggingService.error(
        'Error fetching all users',
        error instanceof Error ? error.stack : String(error),
        'UserService',
      );
      throw error;
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
        this.loggingService.error(
          `User not found with id: ${id}`,
          undefined,
          'UserService',
        );
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
        throw error;
      }

      this.loggingService.error(
        `Unexpected error in getUserById for id: ${id}`,
        error instanceof Error ? error.stack : String(error),
        'UserService',
      );
      throw error;
    }
  }

  async createUser(dto: CreateUserDto): Promise<IUser> {
    try {
      this.loggingService.log(
        `Creating user with login: ${dto.login}`,
        'UserService',
      );

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

      this.loggingService.log(
        `User created successfully with id: ${user.id}`,
        'UserService',
      );

      return {
        ...user,
        createdAt: Number(user.createdAt),
        updatedAt: Number(user.updatedAt),
      };
    } catch (error) {
      this.loggingService.error(
        `Error creating user with login: ${dto.login}`,
        error instanceof Error ? error.stack : String(error),
        'UserService',
      );
      throw error;
    }
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<IUser> {
    try {
      const user = await this.getUserById(id);

      if (user.password !== dto.oldPassword) {
        this.loggingService.error(
          `Password mismatch for user update: ${id}`,
          undefined,
          'UserService',
        );
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

      this.loggingService.log(
        `User updated successfully: ${id}`,
        'UserService',
      );

      return {
        ...updatedUser,
        createdAt: Number(updatedUser.createdAt),
        updatedAt: Number(updatedUser.updatedAt),
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.loggingService.error(
        `Unexpected error in updateUser for id: ${id}`,
        error instanceof Error ? error.stack : String(error),
        'UserService',
      );
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.getUserById(id);
      await this.prisma.user.delete({
        where: { id },
      });

      this.loggingService.log(
        `User deleted successfully: ${id}`,
        'UserService',
      );
    } catch (error) {
      this.loggingService.error(
        `Error deleting user with id: ${id}`,
        error instanceof Error ? error.stack : String(error),
        'UserService',
      );
      throw error;
    }
  }
}
