import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { userDataBase } from 'src/common/db';
import { CreateUserDto } from 'src/user/dto/createUser.dto';
import { UpdateUserDto } from 'src/user/dto/updateUser.dto';
import { IUser } from 'src/types/user';
import { validate, v4 as uuid } from 'uuid';

@Injectable()
export class UserService {
  getAll(): IUser[] {
    return userDataBase;
  }

  getUserById(id: string): IUser {
    if (!validate(id))
      throw new BadRequestException(
        'Bad request. userId is invalid (not uuid)',
      );
    const user = userDataBase.find((user) => user.id === id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  createUser(dto: CreateUserDto) {
    const user: IUser = {
      id: uuid(),
      login: dto.login,
      password: dto.password,
      version: 1,
      createdAt: +new Date(),
      updatedAt: +new Date(),
    };
    userDataBase.push(user);
    return { message: 'The user has been created' };
  }

  updateUser(id: string, dto: UpdateUserDto) {
    const user = this.getUserById(id);
    if (user.password !== dto.oldPassword)
      throw new ForbiddenException('oldPassword is wrong');
    user.password = dto.newPassword;
    user.version += 1;
    user.updatedAt = +new Date();
    return user;
  }

  deleteUser(id: string) {
    this.getUserById(id);
    const userIndex = userDataBase.findIndex((user) => user.id === id);
    userDataBase.splice(userIndex, 1);
    return { message: 'Deletes user by ID' };
  }
}
