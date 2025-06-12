import { Global, Module } from '@nestjs/common';
import { PrivilegeSeeder } from '../db-seeder/seeders/privilege';
import { DatabaseSeeder } from './db-seeder.service';
import { UserTypeSeeder } from './seeders/user-types';
import { UserSeeder } from './seeders/users';
import { CourseSeeder } from './seeders/courses';
import { ProfessorSeeder } from './seeders/professors';
import { LabSeeder } from './seeders/labs';
import { DeviceSeeder } from './seeders/devices';
import { StudentSeeder } from './seeders/students';
import { AssistantSeeder } from './seeders/assistants';
import { SoftwareSeeder } from './seeders/software';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course, DoctorCourse } from 'src/database/courses/course.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { CourseGroupSchedule } from 'src/database/courses/course_labs.entity';
import { User } from 'src/database/users/user.entity';
import { UserType } from 'src/database/users/user-type.entity';
import { Privilege, UserPrivilege } from 'src/database/privileges/privilege.entity';
import { Lab } from 'src/database/labs/lab.entity';
import { Device } from 'src/database/devices/device.entity';
import { DeviceSpecification } from 'src/database/devices/device-specification.entity';
import { DeviceSoftware } from 'src/database/devices/devices_softwares.entity';
import { Software } from 'src/database/softwares/software.entity';
import { Student } from 'src/database/students/student.entity';
import { StudentCourses } from 'src/database/students/student_courses.entity';
import { Event } from 'src/database/events/event.entity';
import { EventSchedule, StudentEventSchedule } from 'src/database/events/event_schedules.entity';
import { ExamModel } from 'src/database/events/exam-models.entity';
import { File } from 'src/modules/files/entities/file.entity';

@Global()
@Module({
	imports: [
		ConfigModule,
		TypeOrmModule.forFeature([
			Course,
			CourseGroup,
			CourseGroupSchedule,
			DoctorCourse,
			User,
			UserType,
			Privilege,
			UserPrivilege,
			Lab,
			Device,
			DeviceSpecification,
			DeviceSoftware,
			Software,
			Student,
			StudentCourses,
			Event,
			EventSchedule,
			StudentEventSchedule,
			ExamModel,
			File
		])
	],
	providers: [
		DatabaseSeeder,
		PrivilegeSeeder,
		UserTypeSeeder,
		UserSeeder,
		CourseSeeder,
		ProfessorSeeder,
		LabSeeder,
		SoftwareSeeder,
		DeviceSeeder,
		StudentSeeder,
		AssistantSeeder
	],
})
export class DatabaseSeederModule {}
