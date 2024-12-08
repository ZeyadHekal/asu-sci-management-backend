import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from './decorators';

@Injectable()
export class AuthenticationGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private reflector: Reflector,
		private configService: ConfigService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
		if (isPublic) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const split = request.headers.authorization?.split(' ') ?? [];
		const type = split[0];
		let token = split[1];
		if (type !== 'Bearer') token = null;
		if (!token) {
			throw new UnauthorizedException();
		}
		try {
			const payload = await this.jwtService.verifyAsync(token, {
				secret: this.configService.get<string>('JWT_SECRET'),
			});
			if (payload.refresh) throw new UnauthorizedException();
			request['user'] = payload;
		} catch {
			throw new UnauthorizedException();
		}
		return true;
	}
}
