import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Privilege, UserPrivilegeAssignment, UserTypePrivilegeAssignment } from './privileges/privilege.entity';
import { ConfigService } from '@nestjs/config';
import { User } from './users/user.entity';
import { UserType } from './users/user-type.entity';
import { Student } from './students/student.entity';
import { Course } from './courses/course.entity';
import { Material } from './materials/material.entity';
import { Lab } from './labs/lab.entity';
import { Software } from './softwares/software.entity';
import { StudentCourses } from './students/student_courses.entity';
import { StudentCoursesDegree } from './students/student_course_degrees.entity';
import { Event } from './events/event.entity';
import { EventSchedule } from './events/event_schedules.entity';
import { StudentEventAttendance } from './students/student_event_attendance.entity';
import { StudentsFiles } from './students/student_files.entity';
import { LabSessionAttentance } from './lab_sessions/lab_session_attendance.entity';
import { LabsSessions } from './lab_sessions/lab_session.entity';
import { CoursesLabs } from './courses/course_labs.entity';
import { DeviceReport } from './devices/devices_reports.entity';
import { Device } from './devices/device.entity';
import { DeviceSoftwares } from './devices/devices_softwares.entity';

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
		TypeOrmModule.forFeature([
			User,
			UserType,
			Privilege,
			UserPrivilegeAssignment,
			UserTypePrivilegeAssignment,
			Student,
			Course,
			Material,
			Lab,
			Software,
			StudentCourses,
			Event,
			StudentCoursesDegree,
			EventSchedule,
			StudentEventAttendance,
			StudentsFiles,
			LabsSessions,
			LabSessionAttentance,
			CoursesLabs,
			DeviceReport,
			Device,
			DeviceSoftwares,
		]),
	],
	exports: [TypeOrmModule],
})
export class DatabaseModule {}
