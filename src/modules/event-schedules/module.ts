import { Module } from '@nestjs/common';
import { EventScheduleController } from './controller';
import { EventScheduleService } from './service';

@Module({
    controllers: [EventScheduleController],
	providers: [EventScheduleService],
})
export class EventSchedulesModule {}
