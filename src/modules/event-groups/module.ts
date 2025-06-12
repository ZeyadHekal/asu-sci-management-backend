import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventGroupService } from './service';
import { EventGroupController } from './controller';
import { EventSchedule, StudentEventSchedule } from 'src/database/events/event_schedules.entity';
import { Event } from 'src/database/events/event.entity';
import { Course } from 'src/database/courses/course.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { Lab } from 'src/database/labs/lab.entity';
import { User } from 'src/database/users/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([EventSchedule, StudentEventSchedule, Event, Course, CourseGroup, Lab, User]),
    ],
    controllers: [EventGroupController],
    providers: [EventGroupService],
    exports: [EventGroupService],
})
export class EventGroupModule { } 