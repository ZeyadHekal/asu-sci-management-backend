import { Controller, UseGuards, Post, Body } from '@nestjs/common';
import { PrivilegeService } from './service';
import { UUID } from 'crypto';
import { PrivilegeCode } from './definition';
import { PrivilegesGuard } from './guard/guard';
import { RequirePrivileges } from './guard/decorator';
import { AssignPrivilegeDto } from './dtos';

@Controller('privileges/admin')
@UseGuards(PrivilegesGuard)
@RequirePrivileges({ and: ['MANAGE_PRIVILEGES'] })
export class PrivilegeController {
	constructor(private readonly privilegesService: PrivilegeService) { }

	@Post('assign/user')
	@RequirePrivileges({ and: [PrivilegeCode.ADMIN_PRIVILEGE] })
	async assignPrivilegeToUser(@Body() body: AssignPrivilegeDto) {
		await this.privilegesService.assignPrivilegeToUser(body.userId, body.privilegeCode, body.resourceIds);
		return { success: true };
	}

	// async getAllPrivileges(): Promise<Privilege[]> {
	//     return this.privilegesRepo.find();
	// }

	@Post('assign/usertype')
	async assignPrivilegeToUserType(@Body() body: { userTypeId: UUID; privilegeCode: PrivilegeCode; resourceIds?: UUID[] }) {
		await this.privilegesService.assignPrivilegeToUserType(body.userTypeId, body.privilegeCode, body.resourceIds);
		return { success: true };
	}
}
