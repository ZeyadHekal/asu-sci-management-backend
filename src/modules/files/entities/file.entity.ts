import { UUID } from 'crypto';
import { User } from 'src/database/users/user.entity';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('files')
export class File {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	filename: string;

	@Column()
	originalname: string;

	@Column()
	mimetype: string;

	@Column()
	size: number;

	@Column()
	objectName: string;

	@Column({ nullable: true })
	prefix: string;

	@Column()
	bucket: string;

	@Column({ default: false })
	isPublic: boolean;

	// @Column({ name: 'uploaded_by_id', nullable: true })
	// uploadedById: UUID;

	// @ManyToOne(() => User, { onDelete: 'NO ACTION', onUpdate: 'CASCADE', lazy: true })
	// @JoinColumn({ name: 'uploaded_by_id' })
	// uploadedBy: Promise<User>;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
