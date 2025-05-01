import { Body, Controller, Post } from '@nestjs/common';
import { AuthJwtDto, LoginRequestDto, LoginSuccessDto, PrivilegRefreshDto, RefreshRequsetDto } from './dtos';
import { ApiResponse } from '@nestjs/swagger';
import { AuthService } from './service';
import { CurrentUser, Public } from './decorators';
import { User } from 'src/database/users/user.entity';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Public()
	@Post('login')
	@ApiResponse({ type: LoginSuccessDto, status: 201 })
	async login(@Body() body: LoginRequestDto): Promise<LoginSuccessDto> {
		return this.authService.login(body.username, body.password);
	}

	@Public()
	@Post('refresh')
	@ApiResponse({ type: AuthJwtDto, status: 201 })
	async refreshToken(@Body() body: RefreshRequsetDto): Promise<AuthJwtDto> {
		return this.authService.refreshTokens(body.refreshToken);
	}

	@Post('privileges')
	@ApiResponse({ type: PrivilegRefreshDto, status: 201 })
	async refreshPrivilege(@CurrentUser() user: User): Promise<PrivilegRefreshDto> {
		return this.authService.getPrivileges(user);
	}
}
