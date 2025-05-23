import { Module } from '@nestjs/common';
import { PrivilegeController } from './controller';
import { PrivilegeService } from './service';
import { APP_GUARD } from '@nestjs/core';
import { PrivilegesGuard } from './guard/guard';
import { WebsocketModule } from 'src/websockets/websocket.module';

@Module({
	imports: [WebsocketModule],
	controllers: [PrivilegeController],
	providers: [
		PrivilegeService,
		{
			provide: APP_GUARD,
			useClass: PrivilegesGuard,
		},
	],
})
export class PrivilegesModule {}
