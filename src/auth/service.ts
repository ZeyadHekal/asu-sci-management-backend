import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthJwtDto, LoginSuccessDto, PrivilegRefreshDto, UserInfoDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/database/users/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { transformToInstance } from 'src/base/transformToInstance';

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		private readonly jwtService: JwtService,
	) {}

	async login(username: string, password: string): Promise<LoginSuccessDto> {
		const user = await this.userRepository.findOneBy({ username });
		if (!user || !(await bcrypt.compare(password, user.password))) {
			throw new BadRequestException('Incorrect username or password');
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
			isStudent: userType.name === 'Student'
		});

		return {
			...tokens,
			privileges: Object.keys(privileges),
			user: userInfo
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
}
