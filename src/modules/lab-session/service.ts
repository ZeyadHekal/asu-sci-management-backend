import { BadRequestException, Injectable } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import { Course } from 'src/database/courses/course.entity';

@Injectable()
export class LabSessionService extends BaseService<imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
		@InjectRepository(Course) private readonly courseRepository: Repository<Course>,
	) {
		super(imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto, repository);
	}
	async beforeCreateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		const lab = await this.courseRepository.findOneBy({ id: dto.courseId });
		if (!lab) {
			throw new BadRequestException('Invalid lab id!');
		}
		return dto;
	}
	async beforeUpdateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		const lab = await this.courseRepository.findOneBy({ id: dto.courseId });
		if (!lab) {
			throw new BadRequestException('Invalid lab id!');
		}
		return dto;
	}
}
