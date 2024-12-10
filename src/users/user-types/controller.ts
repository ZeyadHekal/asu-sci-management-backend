import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserTypeService } from './service';
import { CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto } from './dtos';
import { UUID } from 'crypto';
import { BaseController } from 'src/base/base.controller';
import { UserType } from 'src/database/users/user-type.entity';
import { Public } from 'src/auth/decorators';

@Public()
@Controller('user-types')
export class UserTypeController extends BaseController<UserType, CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto, UserTypeDto> {
	constructor(private readonly userTypeService: UserTypeService) {
		super(userTypeService, UserType, CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto, UserTypeDto);
	}

	@Post()
	create(@Body() createUserDto: CreateUserTypeDto) {
		return this.userTypeService.create(createUserDto);
	}

	@Get()
	findAll() {
		return this.getAll();
	}

	@Get(':id')
	getById(@Param('id') id: UUID) {
		return super.getById(id);
	}

	@Patch(':id')
	update(@Param('id') id: UUID, @Body() updateUserDto: UpdateUserTypeDto) {
		return super.update(id, updateUserDto);
	}

	@Delete(':ids')
	delete(@Param('ids') ids: UUID) {
		return super.delete(ids);
	}
}
