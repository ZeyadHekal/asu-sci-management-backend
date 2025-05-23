import { Module } from '@nestjs/common';
import { AuthController } from './controller';
import { AuthService } from './service';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticationGuard } from './providers';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventModule } from 'src/modules/events/module';

@Module({
	imports: [
		JwtModule.registerAsync({
			useFactory: async (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET'),
			}),
			inject: [ConfigService],
		}),
		EventModule,
	],
	controllers: [AuthController],
	providers: [AuthService, { provide: APP_GUARD, useClass: AuthenticationGuard }],
	exports: [AuthService],
})
export class AuthModule {}
