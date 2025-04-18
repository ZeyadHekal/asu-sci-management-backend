import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EventScheduleService } from './service';
import { CreateEventScheduleDto, EventScheduleDto, EventScheduleListDto, UpdateEventScheduleDto} from './dtos';
import { BaseController } from 'src/base/base.controller';
import { UUID } from 'crypto';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { DeleteDto } from 'src/base/delete.dto';
import { Event_schedule } from 'src/database/events/event_schedules.entity';

@Controller('eventSchedule')
export class EventScheduleController extends BaseController<Event_schedule, CreateEventScheduleDto, UpdateEventScheduleDto, EventScheduleDto, EventScheduleListDto> {
	constructor(private readonly eventScheduleService: EventScheduleService) {
		super(eventScheduleService, Event_schedule, CreateEventScheduleDto, UpdateEventScheduleDto, EventScheduleDto, EventScheduleListDto);
	}

	@Post()
	@ApiCreatedResponse({ type: EventScheduleDto })
	create(@Body() createDto: CreateEventScheduleDto): Promise<EventScheduleDto> {
		return super.create(createDto);
	}

	@Get()
	@ApiOkResponse({ type: EventScheduleListDto })
	getAll(): Promise<EventScheduleListDto[]> {
		return super.getAll();
	}

	// TODO: Implement
	@Get('paginated')
	@ApiOkResponse({ type: EventScheduleDto })
	getPaginated(): Promise<EventScheduleDto[]> {
		return;
	}

	@Get(':eventSchedule_id')
	@ApiOkResponse({ type: EventScheduleDto })
	getById(@Param(':eventSchedule_id') id: UUID): Promise<EventScheduleDto> {
		return super.getById(id);
	}

	@Patch(':eventSchedule_id')
	@ApiOkResponse({ type: EventScheduleDto })
	update(@Param('eventSchedule_id') id: UUID, @Body() updateDto: UpdateEventScheduleDto): Promise<EventScheduleDto> {
		return super.update(id, updateDto);
	}

	// TODO: Fix return type
	@Delete(':eventSchedule_ids')
	@ApiOkResponse({ type: DeleteDto })
	delete(@Param('eventSchedule_ids') ids: string): Promise<any> {
		return super.delete(ids);
	}
}
