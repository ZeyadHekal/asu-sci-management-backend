import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as imports from './imports';
import { CourseGroupController } from './controller';
import { CourseGroupCronService } from './course-group-cron.service';
import { Course } from 'src/database/courses/course.entity';
import { Lab } from 'src/database/labs/lab.entity';
import { Device } from 'src/database/devices/device.entity';
import { DeviceSoftware } from 'src/database/devices/devices_softwares.entity';
import { StudentCourses } from 'src/database/students/student_courses.entity';
import { CourseGroupSchedule } from 'src/database/courses/course_labs.entity';
import { User } from 'src/database/users/user.entity';

@Module({
	imports: [TypeOrmModule.forFeature([imports.Entity, Course, Lab, Device, DeviceSoftware, StudentCourses, CourseGroupSchedule, User])],
	controllers: [CourseGroupController],
	providers: [imports.Service, CourseGroupCronService],
	exports: [imports.Service],
})
export class CourseGroupModule {}
