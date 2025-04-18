import { Module } from '@nestjs/common';
import { CourseService } from './service';
import { CourseController } from './controller';

@Module({
	controllers: [CourseController],
	providers: [CourseService],
})
export class CourseModule {}
