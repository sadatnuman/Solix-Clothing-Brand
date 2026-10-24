import { UserRole } from '../../common/enums/user-role.enum';
export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  passwordHash: string;
  role: UserRole;
  permissions: string[];
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
