import { UserRole } from '../../common/enums/user-role.enum';

export type CurrentUser = {
  id: number;
  role: UserRole;
};
