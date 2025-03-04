import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LabService } from './service';
import { CreateLabDto, UpdateLabDto, LabDto, LabListDto } from './dtos';
import { BaseController } from 'src/base/base.controller';
import { UUID } from 'crypto';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { DeleteDto } from 'src/base/delete.dto';
import { Lab } from 'src/database/labs/lab.entity';

@Controller('users')
export class LabController extends BaseController<Lab, CreateLabDto, UpdateLabDto, LabDto, LabListDto> {
	constructor(private readonly labService: LabService) {
		super(labService, Lab, CreateLabDto, UpdateLabDto, LabDto, LabListDto);
	}

	@Post()
	@ApiCreatedResponse({ type: LabDto })
	create(@Body() createDto: CreateLabDto): Promise<LabDto> {
		return super.create(createDto);
	}

	@Get()
	@ApiOkResponse({ type: LabListDto })
	getAll(): Promise<LabListDto[]> {
		return super.getAll();
	}

	// TODO: Implement
	@Get('paginated')
	@ApiOkResponse({ type: LabDto })
	getPaginated(): Promise<LabDto[]> {
		return;
	}

	@Get(':lab_id')
	@ApiOkResponse({ type: LabDto })
	getById(@Param(':lab_id') id: UUID): Promise<LabDto> {
		return super.getById(id);
	}

	@Patch(':lab_id')
	@ApiOkResponse({ type: LabDto })
	update(@Param('lab_id') id: UUID, @Body() updateDto: UpdateLabDto): Promise<LabDto> {
		return super.update(id, updateDto);
	}

	// TODO: Fix return type
	@Delete(':lab_ids')
	@ApiOkResponse({ type: DeleteDto })
	delete(@Param('lab_ids') ids: string): Promise<any> {
		return super.delete(ids);
	}
}
