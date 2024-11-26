import { Body, Controller, Post } from '@nestjs/common';
import { AuthJwtDto, LoginRequestDto, LoginSuccessDto, RefreshRequsetDto } from './dtos';
import { ApiResponse } from '@nestjs/swagger';
import { AuthService } from './service';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('login')
	@ApiResponse({ type: LoginSuccessDto })
	async login(@Body() body: LoginRequestDto): Promise<LoginSuccessDto> {
		return this.authService.login(body.username, body.password);
	}
	@Post('refresh')
	@ApiResponse({ type: AuthJwtDto })
	async refreshToken(@Body() body: RefreshRequsetDto): Promise<AuthJwtDto> {
		return;
	}
}
