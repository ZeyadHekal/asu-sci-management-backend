import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthJwtDto, LoginSuccessDto, PrivilegRefreshDto, UserInfoDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/database/users/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { transformToInstance } from 'src/base/transformToInstance';
import { EventService } from 'src/modules/events/service';
import { DeviceLoginHistoryService } from 'src/modules/device-login-history/service';
import { LoginStatus } from 'src/database/devices/device-login-history.entity';
import { UUID } from 'crypto';

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		private readonly jwtService: JwtService,
		private readonly eventService: EventService,
		private readonly deviceLoginHistoryService: DeviceLoginHistoryService,
	) {}

	async login(username: string, password: string, clientInfo?: { ipAddress?: string; userAgent?: string }): Promise<LoginSuccessDto> {
		const user = await this.userRepository.findOneBy({ username });
		if (!user || !(await bcrypt.compare(password, user.password))) {
			// If login failed and we have client info, try to log the failed attempt
			if (clientInfo?.ipAddress) {
				try {
					const device = await this.deviceLoginHistoryService.findDeviceByIpAddress(clientInfo.ipAddress);
					if (device && user) {
						await this.deviceLoginHistoryService.logFailedLogin(
							device.id,
							user.id,
							clientInfo.ipAddress,
							'Invalid username or password',
							clientInfo.userAgent
						);
					}
				} catch (error) {
					// Log the error but don't fail the login process
					console.warn('Failed to log failed login attempt:', error.message);
				}
			}
			throw new BadRequestException('Incorrect username or password');
		}

		// Update user's last login timestamp
		await this.userRepository.update(user.id, { lastLogin: new Date() });

		// Try to track device login if we have client IP
		if (clientInfo?.ipAddress) {
			try {
				const device = await this.deviceLoginHistoryService.findDeviceByIpAddress(clientInfo.ipAddress);
				if (device) {
					// Check if there's an existing active session for this user and device
					const existingSession = await this.deviceLoginHistoryService.findActiveSessionByUserAndDevice(user.id, device.id);

					// If there's an existing session, update its logout time before creating a new one
					if (existingSession) {
						await this.deviceLoginHistoryService.updateLogoutTime(existingSession.id, new Date());
					}

					// Create new login record
					await this.deviceLoginHistoryService.createLoginRecord({
						deviceId: device.id,
						userId: user.id,
						ipAddress: clientInfo.ipAddress,
						loginStatus: LoginStatus.SUCCESS,
						loginTime: new Date(),
						userAgent: clientInfo.userAgent,
						// You can extract these from userAgent if needed
						operatingSystem: this.extractOSFromUserAgent(clientInfo.userAgent),
						browser: this.extractBrowserFromUserAgent(clientInfo.userAgent),
					});
				}
			} catch (error) {
				// Log the error but don't fail the login process
				console.warn('Failed to create device login record:', error.message);
			}
		}

		// Get user type
		const userType = await user.userType;

		// Get privileges
		const privileges = await user.getUserPrivileges();

		// Generate tokens
		const tokens = await this.generateTokens(user.id, user.name);

		// Create user info
		const userInfo = transformToInstance(UserInfoDto, {
			id: user.id,
			name: user.name,
			username: user.username,
			userType: userType.name,
			isStudent: userType.name === 'Student',
		});

		// Add exam mode status for students
		if (userType.name === 'Student') {
			try {
				const examModeStatus = await this.eventService.getStudentExamModeStatus(user.id);
				userInfo.examModeStatus = examModeStatus;
			} catch (error) {
				// If exam mode status fails, continue without it
				console.warn('Failed to get exam mode status for student:', error.message);
			}
		}

		return {
			...tokens,
			privileges: Object.keys(privileges),
			user: userInfo,
		};
	}

	async refreshTokens(token: string): Promise<AuthJwtDto> {
		try {
			const payload = await this.jwtService.verifyAsync(token);
			const user = await this.userRepository.findOneBy({ id: payload.user_id });
			if (!user || !payload.refresh) throw new UnauthorizedException();
			return this.generateTokens(payload.user_id, user.name);
		} catch (error) {
			console.log(error);
			throw new UnauthorizedException();
		}
	}

	private async generateTokens(user_id: string, name: string): Promise<AuthJwtDto> {
		// TODO: Change on production
		const accessToken = await this.jwtService.signAsync({ user_id, name }, { expiresIn: '1y' });
		const refreshToken = await this.jwtService.signAsync({ user_id, refresh: true }, { expiresIn: '30min' });
		return { accessToken, refreshToken };
	}

	async getPrivileges(user: User): Promise<PrivilegRefreshDto> {
		return { privileges: Object.keys(await user.getUserPrivileges()) };
	}

	// Helper method to extract OS from user agent
	private extractOSFromUserAgent(userAgent?: string): string | undefined {
		if (!userAgent) return undefined;

		if (userAgent.includes('Windows')) return 'Windows';
		if (userAgent.includes('Mac')) return 'macOS';
		if (userAgent.includes('Linux')) return 'Linux';
		if (userAgent.includes('Android')) return 'Android';
		if (userAgent.includes('iOS')) return 'iOS';

		return 'Unknown';
	}

	// Helper method to extract browser from user agent
	private extractBrowserFromUserAgent(userAgent?: string): string | undefined {
		if (!userAgent) return undefined;

		if (userAgent.includes('Chrome')) return 'Chrome';
		if (userAgent.includes('Firefox')) return 'Firefox';
		if (userAgent.includes('Safari')) return 'Safari';
		if (userAgent.includes('Edge')) return 'Edge';
		if (userAgent.includes('Opera')) return 'Opera';

		return 'Unknown';
	}

	// Method to handle logout and update session
	async logout(userId: UUID, clientInfo?: { ipAddress?: string }): Promise<void> {
		if (clientInfo?.ipAddress) {
			try {
				const device = await this.deviceLoginHistoryService.findDeviceByIpAddress(clientInfo.ipAddress);
				if (device) {
					const activeSession = await this.deviceLoginHistoryService.findActiveSessionByUserAndDevice(userId, device.id);
					if (activeSession) {
						await this.deviceLoginHistoryService.updateLogoutTime(activeSession.id, new Date());
					}
				}
			} catch (error) {
				console.warn('Failed to update logout time:', error.message);
			}
		}
	}
}
