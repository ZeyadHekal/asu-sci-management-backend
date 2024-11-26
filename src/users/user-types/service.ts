import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserType } from 'src/database/users/user-type.entity';
import { transformToInstance } from 'src/base/transformToInstance';
import { UUID } from 'crypto';

@Injectable()
export class UserTypeService {
	constructor(@InjectRepository(UserType) private readonly userTypeRepository: Repository<UserType>) {}
	async create(createUserDto: CreateUserTypeDto) {
		if (await this.userTypeRepository.findOneBy({ name: createUserDto.name })) {
			throw new BadRequestException('User type with this name already exists!');
		}
		const insertResult = await this.userTypeRepository.insert(this.mapDtoToEntity(createUserDto));
		const entity = await this.userTypeRepository.findOne({ where: { id: insertResult.identifiers[0].id } });
		return this.mapEntityToDto(entity);
	}

	findAll() {
		return `This action returns all users`;
	}

	findOne(id: UUID) {
		return `This action returns a #${id} user`;
	}

	update(id: UUID, updateUserDto: UpdateUserTypeDto) {
		return `This action updates a #${id} user`;
	}

	remove(id: UUID) {
		return `This action removes a #${id} user`;
	}

	mapDtoToEntity(entity: CreateUserTypeDto | UpdateUserTypeDto): UserType {
		return transformToInstance(UserType, entity);
	}

	mapEntityToDto(entity: UserType): UserTypeDto {
		return transformToInstance(UserTypeDto, entity);
	}
}
