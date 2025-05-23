import { Entity, Column, JoinColumn, OneToOne, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Expose } from 'class-transformer';
import { ManagementEntity } from 'src/base/base.entity';
import { UUID } from 'crypto';
import { OmitType } from '@nestjs/swagger';

@Entity('students')
export class Student extends OmitType(ManagementEntity, ['id']) {
	@PrimaryColumn({ name: 'id' })
	@Expose()
	id: UUID;

	@Column({ nullable: false, unique: true })
	@Expose()
	seatNo: number;

	@Column()
	@Expose()
	level: number;

	@Column({ nullable: false })
	@Expose()
	program: string;

	@Column({ nullable: true })
	@Expose()
	photo: string;

	@CreateDateColumn()
	@Expose()
	created_at: Date;

	@UpdateDateColumn()
	@Expose()
	updated_at: Date;

	@OneToOne(() => User, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: Promise<User>;
}
