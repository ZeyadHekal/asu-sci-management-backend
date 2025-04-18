import { Controller, Post, Body, Get } from '@nestjs/common';
import { PrivilegeService } from './service';
import { UUID } from 'crypto';
import { PRIVILEGE_SEED_DATA, PrivilegeCode } from './definition';
import { RequirePrivileges } from './guard/decorator';
import { UserAssignPrivilegeDto, PrivilegeDto, UserTypeAssignPrivilegeDto } from './dtos';
import { ApiResponse } from '@nestjs/swagger';
import { DeleteDto } from 'src/base/delete.dto';

@Controller('privileges')
export class PrivilegeController {
	constructor(private readonly privilegesService: PrivilegeService) { }

	@Post('assign/user')
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_USER_TYPES] })
	async assignPrivilegeToUser(@Body() body: UserAssignPrivilegeDto) {
		await this.privilegesService.assignPrivilegeToUser(body.userId, body.privilegeCode, body.resourceIds);
		return { success: true };
	}

	@Get()
	@ApiResponse({ type: PrivilegeDto, isArray: true })
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_USER_TYPES] })
	async getAllPrivileges(): Promise<PrivilegeDto[]> {
		return PRIVILEGE_SEED_DATA;
	}

	@Post('assign/usertype')
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_USER_TYPES] })
	async assignPrivilegeToUserType(@Body() body: UserTypeAssignPrivilegeDto) {
		await this.privilegesService.assignPrivilegeToUserType(body.userTypeId, body.privilegeCode, body.resourceIds);
		return { success: true };
	}

	@Post('unassign/usertype')
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_USER_TYPES] })
	@ApiResponse({ type: DeleteDto })
	async unassignPrivilegeToUserType(@Body() body: UserTypeAssignPrivilegeDto) {
		await this.privilegesService.unassignPrivilegeToUserType(body.userTypeId, body.privilegeCode);
		return { success: true };
	}
}
