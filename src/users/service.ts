import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateStudentDto, CreateUserDto, UpdateUserDto, UserDto, UserListDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserType } from 'src/database/users/user-type.entity';
import { User } from 'src/database/users/user.entity';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService extends BaseService<User, CreateUserDto, UpdateUserDto, UserDto, UserListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		@InjectRepository(UserType) private readonly userTypeRepository: Repository<UserType>,
	) {
		super(User, CreateUserDto, UpdateUserDto, UserDto, UserListDto, userRepository);
	}

	async beforeCreateDto(dto: CreateUserDto): Promise<CreateUserDto> {
		const userType = await this.userTypeRepository.findOneBy({ id: dto.userTypeId });
		if (!userType) {
			throw new BadRequestException('Invalid user type id!');
		}
		const user = await this.userRepository.findOneBy({ username: dto.username });
		if (user) {
			throw new BadRequestException('Username is already used.');
		}
		dto.password = await bcrypt.hash(dto.password, parseInt(this.configService.get<string>('PASSWORD_SALT', '10')));
		return dto;
	}

	async beforeUpdateDto(dto: UpdateUserDto): Promise<UpdateUserDto> {
		const userType = await this.userTypeRepository.findOneBy({ id: dto.userTypeId });
		if (!userType) {
			throw new BadRequestException('Invalid user type id!');
		}
		if (dto.username) {
			const user = await this.userRepository.findOneBy({ username: dto.username });
			if (user && user.username != dto.username) {
				throw new BadRequestException('Username is already used.');
			}
		}
		if (dto.password) {
			dto.password = await bcrypt.hash(dto.password, parseInt(this.configService.get<string>('PASSWORD_SALT', '10')));
		}
		return dto;
	}

	async createStudent(dto: CreateStudentDto): Promise<UserDto> {
		const studentType = await this.userTypeRepository.findOneBy({ name: "Student" });
		if (!studentType) {
			throw new InternalServerErrorException("An error occured, please contact admin");
		}
		return this.create({
			...dto,
			userTypeId: studentType.id
		});
	}
}
