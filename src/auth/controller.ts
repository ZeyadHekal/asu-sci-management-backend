import { Body, Controller, Post } from '@nestjs/common';
import { AuthJwtDto, LoginRequestDto, LoginSuccessDto, PrivilegRefreshDto, RefreshRequsetDto } from './dtos';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './service';
import { CurrentUser, Public } from './decorators';
import { User } from 'src/database/users/user.entity';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Public()
	@Post('login')
	@ApiOperation({ summary: 'User login', description: 'Authenticate user with username and password' })
	@ApiResponse({ type: LoginSuccessDto, status: 201, description: 'User successfully authenticated' })
	@ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
	async login(@Body() body: LoginRequestDto): Promise<LoginSuccessDto> {
		return this.authService.login(body.username, body.password);
	}

	@Public()
	@Post('refresh')
	@ApiOperation({ summary: 'Refresh token', description: 'Get new access token using refresh token' })
	@ApiResponse({ type: AuthJwtDto, status: 201, description: 'Token refreshed successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized - Invalid or expired refresh token' })
	async refreshToken(@Body() body: RefreshRequsetDto): Promise<AuthJwtDto> {
		return this.authService.refreshTokens(body.refreshToken);
	}

	@Post('privileges')
	@ApiOperation({ summary: 'Refresh privileges', description: 'Get updated user privileges' })
	@ApiResponse({ type: PrivilegRefreshDto, status: 201, description: 'Privileges refreshed successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async refreshPrivilege(@CurrentUser() user: User): Promise<PrivilegRefreshDto> {
		return this.authService.getPrivileges(user);
	}
}
