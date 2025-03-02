import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserService } from './service';
import { CreateUserPrivilegesDto, CreateStudentPrivilegesDto, UpdateUserPrivilegesDto, UserPrivilegesDto, UserListPrivilegesDto } from './dtos';
import { BaseController } from 'src/base/base.controller';
import { User } from 'src/database/users/user.entity';
import { UUID } from 'crypto';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { DeleteDto } from 'src/base/delete.dto';
import { Public } from 'src/auth/decorators';

@Public()
@Controller('users')
export class UserController extends BaseController<User, CreateUserPrivilegesDto, UpdateUserPrivilegesDto, UserPrivilegesDto, UserListPrivilegesDto> {
	constructor(private readonly userService: UserService) {
		super(userService, User, CreateUserPrivilegesDto, UpdateUserPrivilegesDto, UserPrivilegesDto, UserListPrivilegesDto);
	}

	@Post()
	@ApiCreatedResponse({ type: UserPrivilegesDto })
	create(@Body() createDto: CreateUserPrivilegesDto): Promise<UserPrivilegesDto> {
		return super.create(createDto);
	}

	@Post('create-student')
	@ApiCreatedResponse({ type: UserPrivilegesDto })
	createStudent(@Body() createDto: CreateStudentPrivilegesDto): Promise<UserPrivilegesDto> {
		return this.userService.createStudent(createDto);
	}

	@Get()
	@ApiOkResponse({ type: UserListPrivilegesDto })
	getAll(): Promise<UserListPrivilegesDto[]> {
		return super.getAll();
	}

	// TODO: Implement
	@Get('paginated')
	@ApiOkResponse({ type: UserPrivilegesDto })
	getPaginated(): Promise<UserPrivilegesDto[]> {
		return;
	}

	@Get(':user_id')
	@ApiOkResponse({ type: UserPrivilegesDto })
	getById(@Param('user_id') id: UUID): Promise<UserPrivilegesDto> {
		return super.getById(id);
	}

	@Patch(':user_id')
	@ApiOkResponse({ type: UserPrivilegesDto })
	update(@Param('user_id') id: UUID, @Body() updateDto: UpdateUserPrivilegesDto): Promise<UserPrivilegesDto> {
		return super.update(id, updateDto);
	}

	@Delete(':user_ids')
	@ApiOkResponse({ type: DeleteDto })
	delete(@Param('user_ids') ids: string): Promise<DeleteDto> {
		return super.delete(ids);
	}
}
