import { Module } from '@nestjs/common';
import { PrivilegeController } from './controller';
import { PrivilegeService } from './service';
import { PrivilegeSeeder } from './db-seed';

@Module({
	controllers: [PrivilegeController],
	providers: [PrivilegeService, PrivilegeSeeder],
})
export class PrivilegesModule {}
