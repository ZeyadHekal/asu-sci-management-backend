import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrivilegeService } from './service';
import { User } from 'src/database/users/user.entity';

@Injectable()
export class PrivilegeGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private privilegeService: PrivilegeService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const privilegeExpression = this.reflector.get<PrivilegeExpression>('privileges', context.getHandler());
		if (!privilegeExpression) {
			return true; // No privileges required for this route
		}

		const request = context.switchToHttp().getRequest();
		const user: User = request.user; // Assumed that user is attached to the request object

		const userPrivileges = await this.privilegeService.getUserPrivileges(user);

		// Evaluate the privilege expression with parameters
		return this.evaluatePrivilegeExpression(privilegeExpression, userPrivileges, request);
	}

	private evaluatePrivilegeExpression(expression: PrivilegeExpression, userPrivileges: string[]): boolean {
		if (expression.type === 'AND') {
			return this.evaluateAND(expression.privileges, userPrivileges);
		} else if (expression.type === 'OR') {
			return this.evaluateOR(expression.privileges, userPrivileges);
		}
		return false;
	}

	private async evaluateAND(privileges: (string | PrivilegeExpression)[], userPrivileges: string[], request: any): Promise<boolean> {
		// Check if the user has all privileges in the AND expression
		return privileges.every(async (privilege) => {
			if (typeof privilege === 'string') {
				const privilegeData = await this.privilegeService.getPrivilegeByName(privilege);
				if (privilegeData && privilegeData.parameterStructure) {
					// Validate parameters for parameterized privileges
					const isValid = this.validateParameters(privilegeData, request);
					if (!isValid) return false; // If parameters are invalid, return false
				}
				return userPrivileges.includes(privilege); // Check for basic privilege
			} else {
				// Recursively evaluate nested privilege expressions
				return this.evaluatePrivilegeExpression(privilege, userPrivileges, request);
			}
		});
	}

	private async evaluateOR(privileges: (string | PrivilegeExpression)[], userPrivileges: string[], request: any): Promise<boolean> {
		// Check if the user has at least one privilege in the OR expression
		return privileges.some(async (privilege) => {
			if (typeof privilege === 'string') {
				const privilegeData = await this.privilegeService.getPrivilegeByName(privilege);
				if (privilegeData && privilegeData.parameterStructure) {
					// Validate parameters for parameterized privileges
					const isValid = this.validateParameters(privilegeData, request);
					if (!isValid) return false; // If parameters are invalid, return false
				}
				return userPrivileges.includes(privilege); // Check for basic privilege
			} else {
				// Recursively evaluate nested privilege expressions
				return this.evaluatePrivilegeExpression(privilege, userPrivileges, request);
			}
		});
	}
}
