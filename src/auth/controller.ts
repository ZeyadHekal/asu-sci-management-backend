import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthJwtDto, LoginRequestDto, LoginSuccessDto, PrivilegRefreshDto, RefreshRequsetDto } from './dtos';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './service';
import { CurrentUser, Public } from './decorators';
import { User } from 'src/database/users/user.entity';
import { Request } from 'express';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Public()
	@Post('login')
	@ApiOperation({ summary: 'User login', description: 'Authenticate user with username and password' })
	@ApiResponse({ type: LoginSuccessDto, status: 201, description: 'User successfully authenticated' })
	@ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
	async login(@Body() body: LoginRequestDto, @Req() request: Request): Promise<LoginSuccessDto> {
		// Extract client information for device tracking
		const clientInfo = {
			ipAddress: this.getClientIpAddress(request),
			userAgent: request.headers['user-agent'],
		};

		return this.authService.login(body.username, body.password, clientInfo);
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

	@Post('logout')
	@ApiOperation({ summary: 'User logout', description: 'Logout user and update session tracking' })
	@ApiResponse({ status: 200, description: 'User logged out successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async logout(@CurrentUser() user: User, @Req() request: Request): Promise<{ message: string }> {
		// Extract client information for session tracking
		const clientInfo = {
			ipAddress: this.getClientIpAddress(request),
		};

		await this.authService.logout(user.id, clientInfo);
		return { message: 'Logged out successfully' };
	}

	// Helper method to extract client IP address
	private getClientIpAddress(request: Request): string {
		// Check for forwarded IP addresses first (in case of proxy/load balancer)
		const forwarded = request.headers['x-forwarded-for'];
		if (forwarded) {
			// x-forwarded-for can contain multiple IPs, get the first one
			const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
			return ips.split(',')[0].trim();
		}

		// Check for real IP header
		const realIp = request.headers['x-real-ip'];
		if (realIp) {
			return Array.isArray(realIp) ? realIp[0] : realIp;
		}

		// Fall back to connection remote address
		return request.connection?.remoteAddress ||
			request.socket?.remoteAddress ||
			request.ip ||
			'Unknown';
	}
}
