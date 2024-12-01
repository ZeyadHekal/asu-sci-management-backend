import { Entity, Column, JoinColumn ,OneToOne, PrimaryColumn, ManyToMany, JoinTable} from 'typeorm';
import { User } from '../users/user.entity';
import { Expose } from 'class-transformer';
import { ManagementEntity } from 'src/base/base.entity';
import { UUID } from 'crypto';
import { Course } from '../courses/course.entity';
import { OmitType } from '@nestjs/swagger';

@Entity('students')
export class Student extends OmitType(ManagementEntity,['id']){
    @PrimaryColumn({name:'user_id'})
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


	@OneToOne(() => User, { nullable: false, lazy: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
	@JoinColumn({name:'user_id'})
	user: Promise<User>;


}



