import { UserRole } from '../../common/enums/user-role.enum';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};
