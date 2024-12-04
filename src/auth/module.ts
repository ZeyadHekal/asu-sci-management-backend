import { Module } from '@nestjs/common';
import { AuthController } from './controller';
import { AuthService } from './service';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticationGuard } from './providers';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
	imports: [
		JwtModule.registerAsync({
			useFactory: async (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET'),
			}),
			inject: [ConfigService],
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, { provide: APP_GUARD, useClass: AuthenticationGuard }],
})
export class AuthModule {}
