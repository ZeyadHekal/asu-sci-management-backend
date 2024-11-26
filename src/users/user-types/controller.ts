import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserTypeService } from './service';
import { CreateUserTypeDto, UpdateUserTypeDto } from './dtos';
import { UUID } from 'crypto';

@Controller('user-types')
export class UserTypeController {
	constructor(private readonly userTypeService: UserTypeService) {}

	@Post()
	create(@Body() createUserDto: CreateUserTypeDto) {
		return this.userTypeService.create(createUserDto);
	}

	@Get()
	findAll() {
		return this.userTypeService.findAll();
	}

	@Get(':id')
	findOne(@Param('id') id: UUID) {
		return this.userTypeService.findOne(id);
	}

	@Patch(':id')
	update(@Param('id') id: UUID, @Body() updateUserDto: UpdateUserTypeDto) {
		return this.userTypeService.update(id, updateUserDto);
	}

	@Delete(':id')
	remove(@Param('id') id: UUID) {
		return this.userTypeService.remove(id);
	}
}
