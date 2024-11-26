import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LoginSuccessDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/database/users/user.entity';

@Injectable()
export class AuthService {
	constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}

	async login(username: string, password: string): Promise<LoginSuccessDto> {
		const user = await this.userRepository.findOneBy({ username });
		if (!user) {
			throw new BadRequestException('Incorrect username or password');
		}

		return;
	}
}
