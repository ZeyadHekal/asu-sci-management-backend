import { Module } from '@nestjs/common';
import { EventScheduleService } from './service';
import { EventScheduleController } from './controller';

@Module({
	controllers: [EventScheduleController],
	providers: [EventScheduleService],
})
export class EventScheduleModule {}
