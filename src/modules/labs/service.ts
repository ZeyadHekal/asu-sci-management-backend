import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLabDto, UpdateLabDto, LabDto, LabListDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import { Lab } from 'src/database/labs/lab.entity';

@Injectable()
export class LabService extends BaseService<Lab, CreateLabDto, UpdateLabDto, LabDto, LabListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(Lab) private readonly labRepository: Repository<Lab>,
	) {
		super(Lab, CreateLabDto, UpdateLabDto, LabDto, LabListDto, labRepository);
	}
}
