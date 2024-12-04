import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Privilege } from './privileges/privilege.entity';
import { ConfigService } from '@nestjs/config';
import { User } from './users/user.entity';
import { UserType } from './users/user-type.entity';
import { Student } from './students/student.entity';
import { Course } from './courses/course.entity';
import { Matetial } from './materials/material.entity';
import { Lab } from './labs/lab.entity';
import { Application } from './applications/application.entity';
import { Student_courses } from './students/student_courses.entity';
import { Student_courses_degree } from './students/student_course_degrees.entity';
import { Event } from './events/event.entity';
import { Event_schedule } from './events/event_schedules.entity';
import { Student_event_attendance } from './students/student_event_attendance.entity';
import { Students_files } from './students/student_files.entity';
import { Lab_session_attentance } from './lab_sessions/lab_session_attendance.entity';
import { Labs_sesstions } from './lab_sessions/lab_session.entity';
import { Courses_labs } from './courses/course_labs.entity';
import { DeviceReport } from './devices/devices_reports.entity';
import { Device } from './devices/device.entity';
import { DeviceApplications } from './devices/devices_applications.entity';

@Global()
@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				type: 'mysql',
				host: configService.get<string>('DB_HOST', 'localhost'),
				port: configService.get<number>('DB_PORT', 3306),
				username: configService.get<string>('DB_USERNAME', 'root'),
				password: configService.get<string>('DB_PASSWORD', ''),
				database: configService.get<string>('DB_NAME', 'management_system'),
				synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true), // Use only in development
				logging: configService.get<boolean>('DB_LOGGING', false),
				autoLoadEntities: true,
			}),
		}),
		TypeOrmModule.forFeature([User, UserType, Privilege, Student, Course, Matetial,
			Lab, Application, Student_courses, Event, Student_courses_degree,
			Event_schedule, Student_event_attendance, Students_files,
			Labs_sesstions, Lab_session_attentance, Courses_labs, DeviceReport,
			Device, DeviceApplications]),
	],
	exports: [TypeOrmModule],
})
export class DatabaseModule {}
