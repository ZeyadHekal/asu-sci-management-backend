import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { User } from '../users/user.entity';
import { Course } from './course.entity';
import { OmitType } from '@nestjs/swagger';
import { ManagementEntity } from 'src/base/base.entity';

export enum CourseAccessSection {
    GRADES = 'grades',
    EVENTS = 'events',
    CONTENT = 'content',
    GROUPS = 'groups'
}

@Entity('course_access_permissions')
@Index('idx_course_access_user_course', ['userId', 'courseId'])
@Index('idx_course_access_course_section', ['courseId', 'section'])
export class CourseAccessPermission extends OmitType(ManagementEntity, ['id']) {
    @PrimaryColumn({ name: 'user_id' })
    @Expose()
    userId: UUID;

    @PrimaryColumn({ name: 'course_id' })
    @Expose()
    courseId: UUID;

    @PrimaryColumn({ type: 'enum', enum: CourseAccessSection })
    @Expose()
    section: CourseAccessSection;

    @Column({ default: false })
    @Expose()
    canView: boolean;

    @Column({ default: false })
    @Expose()
    canEdit: boolean;

    @Column({ default: false })
    @Expose()
    canDelete: boolean;

    @Column({ nullable: true, name: 'granted_by' })
    @Expose()
    grantedBy?: UUID;

    @CreateDateColumn()
    @Expose()
    created_at: Date;

    @UpdateDateColumn()
    @Expose()
    updated_at: Date;

    @ManyToOne(() => User, { nullable: false, lazy: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: Promise<User>;

    @ManyToOne(() => Course, { nullable: false, lazy: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'course_id' })
    course: Promise<Course>;

    @ManyToOne(() => User, { nullable: true, lazy: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'granted_by' })
    grantor?: Promise<User>;
} 