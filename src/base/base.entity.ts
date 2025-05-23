import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { BaseEntity, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export class ManagementEntity extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	@Expose()
	id: UUID;

	@CreateDateColumn()
	@Expose()
	created_at: Date;

	@UpdateDateColumn()
	@Expose()
	updated_at: Date;

	async getIds(objects: any, key: string = 'id'): Promise<number[]> {
		const ret: number[] = [];
		for (const obj of objects) {
			ret.push(await obj[key]);
		}
		return ret;
	}
}
