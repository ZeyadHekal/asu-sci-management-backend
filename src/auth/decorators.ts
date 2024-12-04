import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';

export const IS_PUBLIC_KEY = 'PUBLIC';

export function Public(): MethodDecorator & ClassDecorator {
	return applyDecorators(
		SetMetadata(IS_PUBLIC_KEY, true),
		ApiSecurity({}), // This effectively removes security for this endpoint
	);
}
