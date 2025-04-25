import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrivilegeService } from '../service';
import { PRIVILEGES_METADATA_KEY, PrivilegesLogic } from './decorator';
import { UUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/users/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PrivilegesGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private privilegesService: PrivilegeService,
		@InjectRepository(User) private userRepostiroy: Repository<User>,
	) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		return true;
		const requiredPrivileges = this.reflector.getAllAndOverride<PrivilegesLogic>(PRIVILEGES_METADATA_KEY, [context.getHandler(), context.getClass()]);
		if (!requiredPrivileges) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const user = request.user;
		const userPrivileges = await user.getUserPrivileges();
		return this.checkPrivileges(requiredPrivileges, userPrivileges, request);
	}

	private checkPrivileges(
		logic: PrivilegesLogic,
		userPrivileges: Record<string, { resourceIds: UUID[] | null; paramKey: string | null; requiresResource: boolean; entityName: string | null }>,
		request: any,
	): boolean {
		if (logic.and) {
			return logic.and.every((item) => this.checkItem(item, userPrivileges, request));
		}
		if (logic.or) {
			return logic.or.some((item) => this.checkItem(item, userPrivileges, request));
		}
		return true;
	}

	private checkItem(
		item: string | PrivilegesLogic | { privilege: string },
		userPrivileges: Record<string, { resourceIds: UUID[] | null; paramKey: string | null; requiresResource: boolean; entityName: string | null }>,
		request: any,
	): boolean {
		if (typeof item === 'string') {
			return this.hasPrivilege(item, userPrivileges, request);
		} else if ('privilege' in item) {
			return this.hasPrivilege(item.privilege, userPrivileges, request);
		} else {
			return this.checkPrivileges(item, userPrivileges, request);
		}
	}

	private hasPrivilege(
		privilegeName: string,
		userPrivileges: Record<string, { resourceIds: UUID[] | null; paramKey: string | null; requiresResource: boolean; entityName: string | null }>,
		request: any,
	): boolean {
		const p = userPrivileges[privilegeName];
		if (!p) return false;

		if (!p.requiresResource) {
			// No resource needed
			return true;
		}

		// If requiresResource, extract resource ID from the paramKey
		if (!p.paramKey) {
			// If requiresResource is true but no paramKey specified, deny
			return false;
		}

		const resourceId = request.params[p.paramKey];
		if (!resourceId) {
			// If we can't find a resource id where required, deny
			return false;
		}

		// Check resourceIds array (null means all allowed)
		if (p.resourceIds === null) {
			return true;
		}
		return p.resourceIds.includes(resourceId);
	}
}
