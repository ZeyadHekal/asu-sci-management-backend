import { Module } from '@nestjs/common';
import { StudentController } from './controller';
import { StudentService } from './service';

@Module({
    controllers: [StudentController],
	providers: [StudentService],
})
export class StudentsModule {}
