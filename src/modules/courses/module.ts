import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseService } from './service';
import { CourseController } from './controller';
import { Course } from 'src/database/courses/course.entity';
import { StudentCourses } from 'src/database/students/student_courses.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { User } from 'src/database/users/user.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Course, StudentCourses, CourseGroup, User])],
	controllers: [CourseController],
	providers: [CourseService],
	exports: [CourseService],
})
export class CourseModule {}
