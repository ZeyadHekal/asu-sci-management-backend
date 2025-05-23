import { Controller, Post, Body, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { PrivilegeService } from './service';
import { UUID } from 'crypto';
import { PRIVILEGE_SEED_DATA, PrivilegeCode } from '../db-seeder/data/privileges';
import { RequirePrivileges } from './guard/decorator';
import { UserAssignPrivilegeDto, PrivilegeDto, UserTypeAssignPrivilegeDto } from './dtos';
import { ApiResponse, ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { DeleteDto } from 'src/base/delete.dto';
import { UserDto } from 'src/users/dtos';

@ApiTags('privileges')
@Controller('privileges')
export class PrivilegeController {
	constructor(private readonly privilegesService: PrivilegeService) {}

	@Get()
	@ApiOperation({ summary: 'Get all privileges' })
	@ApiBearerAuth()
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	async getAllPrivileges() {
		return this.privilegesService.getAllPrivileges();
	}

	@Post('assign/user')
	@ApiOperation({ summary: 'Assign privilege to user', description: 'Assign a specific privilege to a user' })
	@ApiBearerAuth()
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	async assignPrivilegeToUser(@Body() body: UserAssignPrivilegeDto) {
		await this.privilegesService.assignPrivilegeToUser(body.userId, body.privilegeCode, body.resourceIds);
		return { success: true };
	}

	@Post('assign/usertype')
	@ApiOperation({ summary: 'Assign privilege to user type', description: 'Assign a specific privilege to a user type' })
	@ApiBearerAuth()
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	async assignPrivilegeToUserType(@Body() body: UserTypeAssignPrivilegeDto) {
		await this.privilegesService.assignPrivilegeToUserType(body.userTypeId, body.privilegeCode, body.resourceIds);
		return { success: true };
	}

	@Post('unassign/user')
	@ApiOperation({ summary: 'Unassign privilege from user', description: 'Remove a specific privilege from a user' })
	@ApiBearerAuth()
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@ApiResponse({ type: DeleteDto })
	async unassignPrivilegeFromUser(@Body() body: UserAssignPrivilegeDto) {
		return this.privilegesService.unassignPrivilegeFromUser(body.userId, body.privilegeCode);
	}

	@Post('unassign/usertype')
	@ApiOperation({ summary: 'Unassign privilege from user type', description: 'Remove a specific privilege from a user type' })
	@ApiBearerAuth()
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	@ApiResponse({ type: DeleteDto })
	async unassignPrivilegeFromUserType(@Body() body: UserTypeAssignPrivilegeDto) {
		return this.privilegesService.unassignPrivilegeFromUserType(body.userTypeId, body.privilegeCode);
	}

	@Delete('user/:userId/:privilegeCode')
	@ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
	@ApiParam({ name: 'privilegeCode', enum: PrivilegeCode, description: 'Privilege code to unassign' })
	@ApiOperation({ summary: 'Unassign privilege from user', description: 'Remove a specific privilege from a user' })
	@ApiBearerAuth()
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	async unassignPrivilegeFromUserById(@Param('userId') userId: UUID, @Param('privilegeCode') privilegeCode: PrivilegeCode): Promise<DeleteDto> {
		return this.privilegesService.unassignPrivilegeFromUser(userId, privilegeCode);
	}

	@Delete('user-type/:userTypeId/:privilegeCode')
	@ApiParam({ name: 'userTypeId', type: 'string' })
	@ApiParam({ name: 'privilegeCode', enum: PrivilegeCode })
	@ApiOperation({ summary: 'Unassign privilege from user type', description: 'Remove a specific privilege from a user type' })
	@ApiBearerAuth()
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	async unassignPrivilegeFromUserTypeById(@Param('userTypeId') userTypeId: UUID, @Param('privilegeCode') privilegeCode: PrivilegeCode): Promise<DeleteDto> {
		return this.privilegesService.unassignPrivilegeFromUserType(userTypeId, privilegeCode);
	}

	@Get('users/:privilegeCode')
	@ApiParam({ name: 'privilegeCode', enum: PrivilegeCode })
	@ApiOperation({ summary: 'Get users with a specific privilege' })
	@ApiBearerAuth()
	@RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
	async getUsersByPrivilege(@Param('privilegeCode') privilegeCode: PrivilegeCode): Promise<UserDto[]> {
		return this.privilegesService.getUsersByPrivilege(privilegeCode);
	}
}
