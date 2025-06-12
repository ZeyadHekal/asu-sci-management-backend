import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index, ManyToMany, JoinTable } from 'typeorm';
import { ManagementEntity } from 'src/base/base.entity';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { Event } from './event.entity';
import { ExamGroup } from './exam-groups.entity';

@Entity('exam_model_files')
export class ExamModelFile extends ManagementEntity {
    @Column({ nullable: false })
    @Expose()
    fileName: string;

    @Column({ nullable: false })
    @Expose()
    originalFileName: string;

    @Column({ nullable: false })
    @Expose()
    filePath: string;

    @Column({ nullable: false })
    @Expose()
    fileSize: number;

    @Column({ nullable: false })
    @Expose()
    mimeType: string;

    @Column({ nullable: false, name: 'exam_model_id' })
    @Expose()
    examModelId: UUID;

    @ManyToOne(() => ExamModel, (model) => model.files, { nullable: false, lazy: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'exam_model_id' })
    examModel: Promise<ExamModel>;

    // Helper method to generate file URL
    getFileUrl(baseUrl: string): string {
        return `${baseUrl}/exam-models/download/${this.examModelId}/file/${this.id}`;
    }
}

@Entity('exam_models')
@Index('idx_exam_models_event', ['eventId'])
@Index('idx_exam_models_version', ['eventId', 'version'])
export class ExamModel extends ManagementEntity {
    @Column({ nullable: false })
    @Expose()
    name: string;

    @Column({ nullable: false })
    @Expose()
    version: string;

    @Column({ nullable: true })
    @Expose()
    description?: string;

    @Column({ nullable: false, default: 0 })
    @Expose()
    assignedStudentCount: number;

    @Column({ nullable: false, default: true })
    @Expose()
    isActive: boolean;

    @Column({ nullable: false, name: 'event_id' })
    @Expose()
    eventId: UUID;

    @ManyToOne(() => Event, { nullable: false, lazy: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event: Promise<Event>;

    @OneToMany(() => ExamModelFile, (file) => file.examModel, { lazy: true })
    files: Promise<ExamModelFile[]>;

    @ManyToMany(() => ExamGroup, (group) => group.assignedModels, { lazy: true })
    assignedGroups: Promise<ExamGroup[]>;

    // Helper method to generate file URLs
    async getFileUrls(baseUrl: string): Promise<string[]> {
        const files = await this.files;
        return files.map(file => file.getFileUrl(baseUrl));
    }
} 