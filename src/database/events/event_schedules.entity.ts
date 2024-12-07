import { Entity, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { ManagementEntity } from 'src/base/base.entity';
import { Lab } from '../labs/lab.entity';
import { Event } from './event.entity';
import { User } from '../users/user.entity';

@Entity('event_schedules')
export class EventSchedule extends ManagementEntity {
	@Column({ name: 'event_id' })
	@Expose()
	eventId: UUID;

	@Column({ name: 'lab_id' })
	@Expose()
	labId: UUID;

	@Column()
	@Expose()
	dateTime: Date;

	@Column()
	@Expose()
	examFiles: string;

	@Column({ name: 'assisstant_id' })
	@Expose()
	assisstantId: UUID;

	@ManyToOne(() => Event, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'event_id' })
	event: Promise<Event>;

	@ManyToOne(() => Lab, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'lab_id' })
	lab: Promise<Lab>;

	@ManyToMany(() => User, (user) => user.event_schedules, {
		cascade: true,
		lazy: true,
	})
	@JoinTable({ name: 'event_schedules_assisstance' })
	assisstant: Promise<User[]>;
}
