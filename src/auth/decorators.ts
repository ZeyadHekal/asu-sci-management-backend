import { ExecutionContext, SetMetadata, UnauthorizedException, applyDecorators, createParamDecorator } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { isInstance } from 'class-validator';
import { User } from 'src/database/users/user.entity';

export const IS_PUBLIC_KEY = 'PUBLIC';

export function Public(): MethodDecorator & ClassDecorator {
	return applyDecorators(
		SetMetadata(IS_PUBLIC_KEY, true),
		ApiSecurity({}), // This effectively removes security for this endpoint
	);
}

export const CurrentUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		if (!request.user || !isInstance(request.user, User)) {
			console.log(request.user);
			throw new UnauthorizedException();
		}
		return request.user;
	},
);
