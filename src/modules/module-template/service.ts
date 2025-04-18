import { Injectable } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';

@Injectable()
export class TemplateService extends BaseService<imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
	) {
		super(imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto, repository);
	}

}
