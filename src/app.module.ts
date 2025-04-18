import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrivilegesModule } from './privileges/module';
import { DatabaseModule } from './database/module';
import { UserModule } from './users/module';
import { AuthModule } from './auth/module';
import { LabsModule } from './modules/labs/module';
import { EventsModule } from './modules/events/module';
import { StudentsModule } from './modules/students/module';
import { CoursesModule } from './modules/courses2/module';
import { EventSchedulesModule } from './modules/event-schedules/module';

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
		LabsModule,
		EventsModule,
		StudentsModule,
		CoursesModule,
		EventSchedulesModule,
	],
})
export class AppModule {}
