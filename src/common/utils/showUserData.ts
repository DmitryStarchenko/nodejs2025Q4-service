import { IUser } from 'src/types/user';

export const showUserData = (user: IUser | IUser[]) => {
  console.log(typeof user);
};
