import { Controller, Get } from '@nestjs/common';
import { PrivilegeService } from './service';

@Controller('privileges')
export class PrivilegeController {
	constructor(private readonly privilegeService: PrivilegeService) {}

	@Get()
	async getAllPrivilegesGrouped() {
		return this.privilegeService.getAllPrivilegesGrouped();
	}
}
