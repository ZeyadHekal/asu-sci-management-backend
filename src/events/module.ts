import { Module } from '@nestjs/common';
import { EventController } from './controller';
import { EventService } from './service';

@Module({
    controllers: [EventController],
	providers: [EventService],
})
export class EventsModule {}
