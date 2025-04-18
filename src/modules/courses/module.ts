import { Module } from '@nestjs/common';
import { CourseController } from './controller';
import { CourseService } from './service';

@Module({
    controllers: [CourseController],
	providers: [CourseService],
})
export class CoursesModule {}
