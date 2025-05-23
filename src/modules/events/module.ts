import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventService } from './service';
import { EventController } from './controller';
import { Event } from 'src/database/events/event.entity';
import { EventSchedule, StudentEventSchedule } from 'src/database/events/event_schedules.entity';
import { ExamGroup } from 'src/database/events/exam-groups.entity';
import { ExamModel, ExamModelFile } from 'src/database/events/exam-models.entity';
import { Course } from 'src/database/courses/course.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { Lab } from 'src/database/labs/lab.entity';
import { User } from 'src/database/users/user.entity';
import { Device } from 'src/database/devices/device.entity';
import { WebsocketModule } from 'src/websockets/websocket.module';
import { FileModule } from '../files/module';
import { CourseGroupModule } from '../course-groups/module';
import { ExamModelModule } from '../exam-models/module';
import { StudentFilesModule } from '../students/student-files.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Event,
			EventSchedule,
			StudentEventSchedule,
			ExamGroup,
			ExamModel,
			ExamModelFile,
			Course,
			CourseGroup,
			Lab,
			User,
			Device
		]),
		ScheduleModule.forRoot(),
		WebsocketModule,
		FileModule,
		CourseGroupModule,
		ExamModelModule,
		StudentFilesModule,
	],
	controllers: [EventController],
	providers: [EventService],
	exports: [EventService],
})
export class EventModule {}
