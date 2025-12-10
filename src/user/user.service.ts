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
    const users = await this.prisma.user.findMany();
    return users.map((user) => ({
      ...user,
      createdAt: Number(user.createdAt),
      updatedAt: Number(user.updatedAt),
    }));
  }

  async getUserById(id: string): Promise<IUser> {
    if (!validate(id))
      throw new BadRequestException(
        'Bad request. userId is invalid (not uuid)',
      );
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      ...user,
      createdAt: Number(user.createdAt),
      updatedAt: Number(user.updatedAt),
    };
  }

  async createUser(dto: CreateUserDto): Promise<IUser> {
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
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<IUser> {
    const user = await this.getUserById(id);
    if (user.password !== dto.oldPassword)
      throw new ForbiddenException('oldPassword is wrong');

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
  }

  async deleteUser(id: string): Promise<void> {
    await this.getUserById(id);
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
