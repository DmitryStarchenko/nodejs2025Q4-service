import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from 'src/common/db';
import { CreateUserDto } from 'src/dto/createUser.dto';
import { IUser } from 'src/types/user';
import { validate, v4 as uuid } from 'uuid';

@Injectable()
export class UserService {
  getAll(): IUser[] {
    return db;
  }

  getUserById(id: string) {
    if (!validate(id)) throw new BadRequestException('ID not UUID');
    const user = db.find((user) => user.id === id);
    if (!user) throw new NotFoundException('This user does not exist');
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
    db.push(user);
    return { message: 'User created' };
  }
}
