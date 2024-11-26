import { Injectable } from '@nestjs/common';
import { CreateDefaultDto, UpdateDefaultDto } from './dtos';
import { UUID } from 'crypto';

@Injectable()
export class DefaultService {
	create(createDefaultDto: CreateDefaultDto) {}

	findAll() {
		return `This action returns all users`;
	}

	findOne(id: UUID) {
		return `This action returns a #${id} user`;
	}

	update(id: UUID, updateDefaultDto: UpdateDefaultDto) {
		return `This action updates a #${id} user`;
	}

	remove(id: UUID) {
		return `This action removes a #${id} user`;
	}
}
