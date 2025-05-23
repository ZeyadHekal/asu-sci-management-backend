import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

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

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
