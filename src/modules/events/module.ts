import { Module } from '@nestjs/common';
import { EventService } from './service';
import { EventController } from './controller';

@Module({
	controllers: [EventController],
	providers: [EventService],
})
export class EventModule {}
