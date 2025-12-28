import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  userId: number;
  email: string;
}

/**
 * Custom decorator to extract the authenticated user from the request
 * Usage: @CurrentUser() user: RequestUser
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    console.log(request.user);
    return request.user as RequestUser;
  },
);
