import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { ManagementEntity } from 'src/base/base.entity';
import { Student } from '../students/student.entity';
import { OmitType } from '@nestjs/swagger';
import { LabSession } from './lab_session.entity';

@Entity('lab_session_attentance')
export class LabSessionAttentance extends OmitType(ManagementEntity, ['id']) {
	@PrimaryColumn({ name: 'student_id' })
	@Expose()
	studentId: UUID;

	@PrimaryColumn({ name: 'lab_sesstion_id' })
	@Expose()
	labSesstionId: UUID;

	@PrimaryColumn()
	@Expose()
	isApproved: boolean;

	@Column()
	@Expose()
	points: number;

	@ManyToOne(() => Student, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'student_id' })
	student: Promise<Student>;

	@ManyToOne(() => LabSession, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'lab_sesstion_id' })
	lab_sesstion: Promise<LabSession>;
}
