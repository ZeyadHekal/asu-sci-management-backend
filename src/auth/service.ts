import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthJwtDto, LoginSuccessDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/database/users/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

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
		// Get privileges
		const privileges = '';
		const tokens = await this.generateTokens(user.id);
		return { ...tokens, privileges };
	}

	async refresh(token: string): Promise<AuthJwtDto> {
		try {
			const payload = await this.jwtService.verifyAsync(token);
			const user = await this.userRepository.findOneBy({ id: payload.user_id });
			if (!user || !payload.refresh) throw new UnauthorizedException();
			return this.generateTokens(payload.user_id);
		} catch (error) {
			throw new UnauthorizedException();
		}
	}

	private async generateTokens(user_id: string): Promise<AuthJwtDto> {
		const accessToken = await this.jwtService.signAsync({ user_id }, { expiresIn: '15min' });
		const refreshToken = await this.jwtService.signAsync({ user_id, refresh: true }, { expiresIn: '30min' });
		return { accessToken, refreshToken };
	}
}
