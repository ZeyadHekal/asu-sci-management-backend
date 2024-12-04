import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, ManyToOne, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { ManagementEntity } from 'src/base/base.entity';
import { Student } from '../students/student.entity';
import { OmitType } from '@nestjs/swagger';
import { Labs_sesstions } from './lab_session.entity';

@Entity('lab_session_attentance')
export class Lab_session_attentance extends OmitType(ManagementEntity,['id']){
	@PrimaryColumn({name:'student_id'})
	@Expose()
	studentId: UUID;

	@PrimaryColumn({name:'lab_sesstion_id'})
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
	student:Promise<Student>;

	@ManyToOne(() => Labs_sesstions, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({ name: 'lab_sesstion_id' })
	lab_sesstion:Promise<Labs_sesstions>;

}
