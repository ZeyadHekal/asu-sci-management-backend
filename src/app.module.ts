import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrivilegesModule } from './privileges/module';
import { DatabaseModule } from 'src/database/module';
import { UserModule } from 'src/users/module';
import { AuthModule } from './auth/module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ['.env.local', '.env.dev', '.env.stage', '.env.prod', '.env'],
		}),
		DatabaseModule,
		UserModule,
		AuthModule,
		PrivilegesModule,
	],
})
export class AppModule {}
