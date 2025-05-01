import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserTypeService } from './service';
import { CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto, UserTypeWithPrivilegeDto } from './dtos';
import { UUID } from 'crypto';
import { BaseController } from 'src/base/base.controller';
import { UserType } from 'src/database/users/user-type.entity';
import { RequirePrivileges } from 'src/privileges/guard/decorator';
import { PrivilegeCode } from 'src/privileges/definition';
import { ApiResponse } from '@nestjs/swagger';
import { DeleteDto } from 'src/base/delete.dto';
import { PrivilegeAssignmentDto } from 'src/privileges/dtos';

@RequirePrivileges({ and: [PrivilegeCode.MANAGE_USER_TYPES] })
@Controller('user-types')
export class UserTypeController extends BaseController<UserType, CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto, UserTypeDto> {
	constructor(private readonly userTypeService: UserTypeService) {
		super(userTypeService, UserType, CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto, UserTypeDto);
	}

	@Post()
	@ApiResponse({ type: UserTypeDto, status: 201 })
	create(@Body() createUserDto: CreateUserTypeDto) {
		return this.userTypeService.create(createUserDto);
	}

	@Get()
	@RequirePrivileges({ or: [PrivilegeCode.MANAGE_USER_TYPES, PrivilegeCode.MANAGE_USERS] })
	@ApiResponse({ type: UserTypeDto, isArray: true, status: 200 })
	findAll() {
		return this.getAll();
	}

	@Get('with-privileges')
	@ApiResponse({ type: UserTypeWithPrivilegeDto, isArray: true, status: 200 })
	findAllWithPrivileges() {
		return this.userTypeService.findAllWithPrivileges();
	}

	@Get(':id')
	@ApiResponse({ type: UserTypeDto, status: 200 })
	getById(@Param('id') id: UUID) {
		return super.getById(id);
	}

	@Get(':id/privileges')
	@ApiResponse({ type: PrivilegeAssignmentDto, isArray: true, status: 200 })
	async getPrivileges(@Param('id') id: UUID): Promise<PrivilegeAssignmentDto[]> {
		return this.userTypeService.getPrivileges(id);
	}

	@Patch(':id')
	@ApiResponse({ type: UserTypeDto, status: 200 })
	update(@Param('id') id: UUID, @Body() updateUserDto: UpdateUserTypeDto) {
		return super.update(id, updateUserDto);
	}

	@Delete(':ids')
	@ApiResponse({ type: DeleteDto, status: 200 })
	delete(@Param('ids') ids: UUID) {
		return super.delete(ids);
	}
}
