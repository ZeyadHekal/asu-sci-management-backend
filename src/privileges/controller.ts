import { Controller, Get } from '@nestjs/common';
import { PrivilegeService } from './service';
import { Privileges } from './decorators';

@Controller('privileges')
export class PrivilegeController {
	constructor(private privilegeService: PrivilegeService) {}

	@Get()
	@Privileges({ type: 'AND', privileges: ['assign_privileges'] })
	async getAllPrivileges() {
		return this.privilegeService.getAllPrivileges();
	}
}
