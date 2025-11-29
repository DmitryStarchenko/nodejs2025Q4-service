/* eslint-disable @typescript-eslint/no-unused-vars */
import { IUser, ResUser } from 'src/types/user';

export const showUserData = (user: IUser | IUser[]): ResUser | ResUser[] => {
  if (Array.isArray(user)) {
    return user.map(({ password, ...rest }) => rest);
  }
  const { password, ...rest } = user;
  return rest;
};
