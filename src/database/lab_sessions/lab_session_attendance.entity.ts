import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { ManagementEntity } from 'src/base/base.entity';
import { Student } from '../students/student.entity';
import { OmitType } from '@nestjs/swagger';
import { LabSession } from './lab_session.entity';

@Entity('lab_session_attendance')
export class LabSessionAttentance extends OmitType(ManagementEntity, ['id']) {
	@PrimaryColumn({ name: 'student_id' })
	@Expose()
	studentId: UUID;

	@PrimaryColumn({ name: 'lab_session_id' })
	@Expose()
	labSessionId: UUID;

	@Column({ type: 'boolean', default: false, name: 'is_attended' })
	@Expose()
	isAttended: boolean;

	@CreateDateColumn()
	@Expose()
	created_at: Date;

	@UpdateDateColumn()
	@Expose()
	updated_at: Date;

	@ManyToOne(() => Student, { nullable: false, lazy: true })
	@JoinColumn({ name: 'student_id' })
	student: Promise<Student>;

	@ManyToOne(() => LabSession, { nullable: false, lazy: true })
	@JoinColumn({ name: 'lab_session_id' })
	labSession: Promise<LabSession>;
}
