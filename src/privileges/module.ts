import { Module } from '@nestjs/common';
import { PrivilegeController } from './controller';
import { PrivilegeService } from './service';

@Module({
	controllers: [PrivilegeController],
	providers: [PrivilegeService],
})
export class PrivilegesModule {}
