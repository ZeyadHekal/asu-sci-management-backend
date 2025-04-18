import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateEventScheduleDto, EventScheduleDto, EventScheduleListDto, UpdateEventScheduleDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import { Event_schedule } from 'src/database/events/event_schedules.entity';

@Injectable()
export class EventScheduleService extends BaseService<Event_schedule, CreateEventScheduleDto, UpdateEventScheduleDto, EventScheduleDto, EventScheduleListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(Event_schedule) private readonly eventScheduleRepository: Repository<Event_schedule>,
	) {
		super(Event_schedule, CreateEventScheduleDto, UpdateEventScheduleDto, EventScheduleDto, EventScheduleListDto, eventScheduleRepository);
	}
}
