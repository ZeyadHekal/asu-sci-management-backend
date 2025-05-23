import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamModelService } from './service';
import { ExamModelController } from './controller';
import { ExamModel, ExamModelFile } from 'src/database/events/exam-models.entity';
import { ExamGroup } from 'src/database/events/exam-groups.entity';
import { Event } from 'src/database/events/event.entity';
import { EventSchedule, StudentEventSchedule } from 'src/database/events/event_schedules.entity';
import { User } from 'src/database/users/user.entity';
import { FileModule } from '../files/module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ExamModel, ExamModelFile, ExamGroup, Event, EventSchedule, StudentEventSchedule, User]),
        FileModule,
    ],
    controllers: [ExamModelController],
    providers: [ExamModelService],
    exports: [ExamModelService],
})
export class ExamModelModule { } 
