import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrivilegesModule } from './privileges/module';
import { DatabaseModule } from './database/module';
import { UserModule } from './users/module';
import { AuthModule } from './auth/module';
import { CourseModule } from './modules/courses/module';
import { EventScheduleModule } from './modules/event-schedules/module';
import { EventModule } from './modules/events/module';
import { LabModule } from './modules/labs/module';
import { StudentModule } from './modules/students/module';
import { DeviceModule } from './modules/devices/module';
import { LabSessionModule } from './modules/lab-session/module';


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
		// Project modules
		LabModule,
		EventModule,
		StudentModule,
		CourseModule,
		EventScheduleModule,
		DeviceModule,
		LabSessionModule,
	],
})
export class AppModule {}
