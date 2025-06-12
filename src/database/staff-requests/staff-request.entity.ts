
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { User } from '../users/user.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';

export enum StaffRequestStatus {
	PENDING = 'PENDING',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
}

@Entity('staff_requests')
export class StaffRequest extends ManagementEntity {
	@Column()
	@Expose()
	name: string;

	@Column()
	@Expose()
	username: string;

	@Column()
	@Expose()
	title: string;

	@Column()
	@Expose()
	department: string;

	@Column()
	@Expose()
	password: string;

	@Column({ nullable: true })
	@Expose()
	idPhoto: string;

	@Column({
		type: 'enum',
		enum: StaffRequestStatus,
		default: StaffRequestStatus.PENDING,
	})
	@Expose()
	status: StaffRequestStatus;

	@Column({ nullable: true })
	@Expose()
	rejectionReason: string;

	@Column({ name: 'user_type_id', nullable: false })
	@Expose()
	userTypeId: UUID;

	@ManyToOne(() => User, { nullable: true, lazy: true })
	@JoinColumn({ name: 'approved_by' })
	approvedBy: Promise<User>;

	@Column({ name: 'approved_by', nullable: true })
	@Expose()
	approvedById: UUID;

	@Column({ nullable: true })
	@Expose()
	approvedAt: Date;
}
