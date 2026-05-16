import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return ctx.switchToHttp().getRequest().user;
  },
);
