import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserType } from 'src/database/users/user-type.entity';
import { BaseService } from 'src/base/base.service';

@Injectable()
export class UserTypeService extends BaseService<UserType, CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto, UserTypeDto> {
	constructor(@InjectRepository(UserType) private readonly userTypeRepository: Repository<UserType>) {
		super(UserType, CreateUserTypeDto, UpdateUserTypeDto, UserTypeDto, UserTypeDto, userTypeRepository);
	}
	async create(createUserDto: CreateUserTypeDto) {
		if (await this.userTypeRepository.findOneBy({ name: createUserDto.name })) {
			throw new BadRequestException('User type with this name already exists!');
		}
		const insertResult = await this.userTypeRepository.insert(await this.mapDtoToEntity(createUserDto));
		const entity = await this.userTypeRepository.findOne({ where: { id: insertResult.identifiers[0].id } });
		return this.mapEntityToGetDto(entity);
	}
}
