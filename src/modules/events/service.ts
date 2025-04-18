import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateEventDto, EventDto, EventListDto, UpdateEventDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import { Event } from 'src/database/events/event.entity';

@Injectable()
export class EventService extends BaseService<Event, CreateEventDto, UpdateEventDto, EventDto, EventListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(Event) private readonly eventRepository: Repository<Event>,
	) {
		super(Event, CreateEventDto, UpdateEventDto, EventDto, EventListDto, eventRepository);
	}
}
