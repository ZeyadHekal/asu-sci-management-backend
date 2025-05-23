import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as imports from './imports';
import { StudentCourseController } from './controller';
import { Course } from 'src/database/courses/course.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { Student } from 'src/database/students/student.entity';
import { Device } from 'src/database/devices/device.entity';
import { DeviceSoftware } from 'src/database/devices/devices_softwares.entity';
import { Software } from 'src/database/softwares/software.entity';
import { Lab } from 'src/database/labs/lab.entity';

@Module({
	imports: [TypeOrmModule.forFeature([imports.Entity, Course, CourseGroup, Student, Device, DeviceSoftware, Software, Lab])],
	controllers: [StudentCourseController],
	providers: [imports.Service],
	exports: [imports.Service],
})
export class StudentCourseModule {}
