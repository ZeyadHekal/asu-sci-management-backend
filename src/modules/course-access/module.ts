import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseAccessController } from './controller';
import { CourseAccessService } from './service';
import { CourseAccessPermission } from 'src/database/courses/course-access.entity';
import { User } from 'src/database/users/user.entity';
import { Course } from 'src/database/courses/course.entity';

@Module({
    imports: [TypeOrmModule.forFeature([CourseAccessPermission, User, Course])],
    controllers: [CourseAccessController],
    providers: [CourseAccessService],
    exports: [CourseAccessService],
})
export class CourseAccessModule { } 