import { Entity, Column } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';

@Entity('labs')
export class Lab extends ManagementEntity {
	@Column({ nullable: false, unique: true })
	@Expose()
	name: string;
}
