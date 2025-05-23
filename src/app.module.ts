import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrivilegesModule } from './privileges/module';
import { DatabaseModule } from './database/module';
import { UserModule } from './users/module';
import { AuthModule } from './auth/module';
import { CourseModule } from './modules/courses/module';
import { EventScheduleModule } from './modules/event-schedules/module';
import { EventModule } from './modules/events/module';
import { EventGroupModule } from './modules/event-groups/module';
import { ExamModelModule } from './modules/exam-models/module';
import { LabModule } from './modules/labs/module';
import { DeviceModule } from './modules/devices/module';
import { LabSessionModule } from './modules/lab-session/module';
import { DatabaseSeederModule } from './db-seeder/db-seeder.module';
import { SoftwareModule } from './modules/softwares/module';
import { FileModule } from './modules/files/module';
import { WebsocketModule } from './websockets/websocket.module';
import { websocketConfig } from './websockets/websocket.config';
import { StaffRequestModule } from './modules/staff-requests/staff-request.module';
import { StudentCourseModule } from './modules/student-courses/module';
import { CourseGroupModule } from './modules/course-groups/module';
import { DeviceReportModule } from './modules/device-reports/module';
import { DeviceLoginHistoryModule } from './modules/device-login-history/module';
import { CourseAccessModule } from './modules/course-access/module';
import { MaterialModule } from './modules/materials/module';
import { StudentFilesModule } from './modules/students/student-files.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ['.env.local', '.env.dev', '.env.stage', '.env.prod', '.env'],
			load: [websocketConfig],
		}),
		ScheduleModule.forRoot(),
		DatabaseModule,
		DatabaseSeederModule,
		UserModule,
		AuthModule,
		PrivilegesModule,
		WebsocketModule,
		// Project modules
		LabModule,
		EventModule,
		EventGroupModule,
		ExamModelModule,
		CourseModule,
		CourseGroupModule,
		EventScheduleModule,
		SoftwareModule,
		DeviceModule,
		DeviceReportModule,
		DeviceLoginHistoryModule,
		LabSessionModule,
		FileModule,
		StaffRequestModule,
		StudentCourseModule,
		CourseAccessModule,
		MaterialModule,
		StudentFilesModule,
	],
})
export class AppModule {}
