import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DefaultService } from './service';
import { CreateDefaultDto, UpdateDefaultDto } from './dtos';
import { UUID } from 'crypto';

@Controller('defaults')
export class DefaultController {
	constructor(private readonly defaultService: DefaultService) {}

	@Post()
	create(@Body() createDefaultDto: CreateDefaultDto) {
		return this.defaultService.create(createDefaultDto);
	}

	@Get()
	findAll() {
		return this.defaultService.findAll();
	}

	@Get(':id')
	findOne(@Param('id') id: UUID) {
		return this.defaultService.findOne(id);
	}

	@Patch(':id')
	update(@Param('id') id: UUID, @Body() updateDefaultDto: UpdateDefaultDto) {
		return this.defaultService.update(id, updateDefaultDto);
	}

	@Delete(':id')
	remove(@Param('id') id: UUID) {
		return this.defaultService.remove(id);
	}
}
