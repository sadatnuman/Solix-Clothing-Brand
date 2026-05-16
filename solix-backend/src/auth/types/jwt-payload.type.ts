import { UserRole } from '../../common/enums/user-role.enum';

export type JwtPayload = {
  sub: number;
  email: string;
  role: UserRole;
};
