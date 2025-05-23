import { Entity, Column } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';

@Entity('event_schedules')
export class EventSchedule extends ManagementEntity {
    @Column({ name: 'submitted_files', type: 'text', nullable: true })
    submittedFiles?: string;

    @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
    submittedAt?: Date;
} 