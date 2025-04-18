import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EventService } from './service';
import { CreateEventDto, EventDto, EventListDto, UpdateEventDto } from './dtos';
import { BaseController } from 'src/base/base.controller';
import { UUID } from 'crypto';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { DeleteDto } from 'src/base/delete.dto';
import { Event } from 'src/database/events/event.entity';

@Controller('events')
export class EventController extends BaseController<Event, CreateEventDto, UpdateEventDto, EventDto, EventListDto> {
	constructor(private readonly eventService: EventService) {
		super(eventService, Event, CreateEventDto, UpdateEventDto, EventDto, EventListDto);
	}

	@Post()
	@ApiCreatedResponse({ type: EventDto })
	create(@Body() createDto: CreateEventDto): Promise<EventDto> {
		return super.create(createDto);
	}

	@Get()
	@ApiOkResponse({ type: EventListDto })
	getAll(): Promise<EventListDto[]> {
		return super.getAll();
	}

	// TODO: Implement
	@Get('paginated')
	@ApiOkResponse({ type: EventDto })
	getPaginated(): Promise<EventDto[]> {
		return;
	}

	@Get(':event_id')
	@ApiOkResponse({ type: EventDto })
	getById(@Param(':event_id') id: UUID): Promise<EventDto> {
		return super.getById(id);
	}

	@Patch(':event_id')
	@ApiOkResponse({ type: EventDto })
	update(@Param('event_id') id: UUID, @Body() updateDto: UpdateEventDto): Promise<EventDto> {
		return super.update(id, updateDto);
	}

	// TODO: Fix return type
	@Delete(':event_ids')
	@ApiOkResponse({ type: DeleteDto })
	delete(@Param('event_ids') ids: string): Promise<any> {
		return super.delete(ids);
	}
}
