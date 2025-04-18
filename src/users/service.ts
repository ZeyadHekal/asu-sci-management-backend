import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserType } from 'src/database/users/user-type.entity';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import * as bcrypt from 'bcrypt';
import { CreateStudentDto } from './dtos';

@Injectable()
export class UserService extends BaseService<imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
		@InjectRepository(UserType) private readonly userTypeRepository: Repository<UserType>,
	) {
		super(imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto, repository);
	}

	async beforeCreateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		const userType = await this.userTypeRepository.findOneBy({ id: dto.userTypeId });
		if (!userType) {
			throw new BadRequestException('Invalid user type id!');
		}
		const user = await this.repository.findOneBy({ username: dto.username });
		if (user) {
			throw new BadRequestException('Username is already used.');
		}
		dto.password = await bcrypt.hash(dto.password, parseInt(this.configService.get<string>('PASSWORD_SALT', '10')));
		return dto;
	}

	async beforeUpdateDto(dto: imports.UpdateDto): Promise<imports.UpdateDto> {
		const userType = await this.userTypeRepository.findOneBy({ id: dto.userTypeId });
		if (!userType) {
			throw new BadRequestException('Invalid user type id!');
		}
		if (dto.username) {
			const user = await this.repository.findOneBy({ username: dto.username });
			if (user && user.username != dto.username) {
				throw new BadRequestException('Username is already used.');
			}
		}
		if (dto.password) {
			dto.password = await bcrypt.hash(dto.password, parseInt(this.configService.get<string>('PASSWORD_SALT', '10')));
		}
		return dto;
	}

	async createStudent(dto: CreateStudentDto): Promise<imports.GetDto> {
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
