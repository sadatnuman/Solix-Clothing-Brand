import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  StaffPermission,
} from '../decorators/permissions.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<StaffPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;
    const request = context.switchToHttp().getRequest<{ user?: User }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Access denied');
    if (user.role === UserRole.ADMIN) return true;
    if (
      user.role === UserRole.STAFF &&
      required.every((permission) => user.permissions?.includes(permission))
    )
      return true;
    throw new ForbiddenException(
      `This staff account needs ${required.join(' and ')} permission`,
    );
  }
}
