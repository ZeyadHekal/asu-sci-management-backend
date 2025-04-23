import { BadRequestException, Injectable } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import { Lab } from 'src/database/labs/lab.entity';
import { User } from 'src/database/users/user.entity';
import { UserType } from 'src/database/users/user-type.entity';

@Injectable()
export class EventScheduleService extends BaseService<imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
		@InjectRepository(Lab) private readonly labRepository: Repository<Lab>,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		@InjectRepository(UserType) private readonly userTypeRepository: Repository<UserType>,
	) {
		super(imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto, repository);
	}

	async beforeCreateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		const lab = await this.labRepository.findOneBy({ id: dto.labId });
		if (!lab) {
			throw new BadRequestException('Invalid lab id!');
		}
		const user = await this.userRepository.findOneBy({ id: dto.assisstantId });
		if (!user) {
			throw new BadRequestException('Invalid lab id!');
		}
		return dto;
	}
	async beforeUpdateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		const lab = await this.labRepository.findOneBy({ id: dto.labId });
		if (!lab) {
			throw new BadRequestException('Invalid lab id!');
		}
		const user = await this.userRepository.findOneBy({ id: dto.assisstantId });
		const assisstantType = await this.userTypeRepository.findOneBy({ name: "Assisstant" });
		if (!user) {
			throw new BadRequestException('Invalid user id!');
		}
		if (!assisstantType) {
			throw new BadRequestException('Invalid assisstant id!');
		}
		return dto;
	}

}
