import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserService } from './service';
import { CreateUserDto, UpdateUserDto, UserDto, UserListDto } from './dtos';
import { BaseController } from 'src/base/base.controller';
import { User } from 'src/database/users/user.entity';
import { UUID } from 'crypto';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { DeleteDto } from 'src/base/delete.dto';

@Controller('users')
export class UserController extends BaseController<User, CreateUserDto, UpdateUserDto, UserDto, UserListDto> {
	constructor(private readonly userService: UserService) {
		super(userService, User, CreateUserDto, UpdateUserDto, UserDto, UserListDto);
	}

	@Post()
	@ApiCreatedResponse({ type: UserDto })
	create(@Body() createDto: CreateUserDto): Promise<UserDto> {
		return super.create(createDto);
	}

	@Get()
	@ApiOkResponse({ type: UserListDto })
	getAll(): Promise<UserListDto[]> {
		return super.getAll();
	}

	// TODO: Implement
	@Get('paginated')
	@ApiOkResponse({ type: UserDto })
	getPaginated(): Promise<UserDto[]> {
		return;
	}

	@Get(':user_id')
	@ApiOkResponse({ type: UserDto })
	getById(@Param(':user_id') id: UUID): Promise<UserDto> {
		return super.getById(id);
	}

	@Patch(':user_id')
	@ApiOkResponse({ type: UserDto })
	update(@Param('user_id') id: UUID, @Body() updateDto: UpdateUserDto): Promise<UserDto> {
		return super.update(id, updateDto);
	}

	// TODO: Fix return type
	@Delete(':user_ids')
	@ApiOkResponse({ type: DeleteDto })
	delete(@Param('user_ids') ids: string): Promise<any> {
		return super.delete(ids);
	}
}
