import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketService } from './websocket.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../users/module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/users/user.entity';
import { StudentEventSchedule } from 'src/database/events/event_schedules.entity';
import { websocketConfig } from './websocket.config';

@Module({
	imports: [
		ConfigModule.forFeature(websocketConfig),
		TypeOrmModule.forFeature([User, StudentEventSchedule]),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET'),
				signOptions: {
					expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
				},
			}),
		}),
		UserModule,
	],
	providers: [WebsocketGateway, WebsocketService],
	exports: [WebsocketService],
})
export class WebsocketModule {}
