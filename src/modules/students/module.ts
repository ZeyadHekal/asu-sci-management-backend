import { Module } from '@nestjs/common';
import { StudentService } from './service';
import { StudentController } from './controller';

@Module({
	controllers: [StudentController],
	providers: [StudentService],
})
export class StudentModule {}
