import { Module } from '@nestjs/common';
import { PrivilegeController } from './controller';
import { PrivilegeService } from './service';
import { PrivilegeSeeder } from './db-seed';
import { APP_GUARD } from '@nestjs/core';
import { PrivilegesGuard } from './guard/guard';

@Module({
	controllers: [PrivilegeController],
	providers: [PrivilegeService, PrivilegeSeeder,
		{
			provide: APP_GUARD,
			useClass: PrivilegesGuard
		}
	],
})
export class PrivilegesModule { }
