import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamModel, ExamModelFile } from 'src/database/events/exam-models.entity';
import { ExamGroup } from 'src/database/events/exam-groups.entity';
import { Event } from 'src/database/events/event.entity';
import { EventSchedule, StudentEventSchedule } from 'src/database/events/event_schedules.entity';
import { User } from 'src/database/users/user.entity';
import { UUID } from 'crypto';
import { FileService } from '../files/file.service';
import { MinioService } from '../files/minio.service';
import { ApiProperty } from '@nestjs/swagger';
import * as path from 'path';

export class UploadExamModelsDto {
    @ApiProperty({ description: 'Name of the exam model' })
    name: string;

    @ApiProperty({ description: 'Description of the exam model', required: false })
    description?: string;

    @ApiProperty({ description: 'Event ID' })
    eventId: UUID;

    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
        description: 'Exam model files to upload'
    })
    files: Express.Multer.File[];
}

export class CreateExamModelRequest {
    @ApiProperty({ description: 'Name of the exam model' })
    name: string;

    @ApiProperty({ description: 'Description of the exam model', required: false })
    description?: string;

    @ApiProperty({ description: 'Event ID' })
    eventId: UUID;

    @ApiProperty({ description: 'Uploaded files', type: 'array', items: { type: 'string', format: 'binary' } })
    files: Express.Multer.File[];
}

export class ExamModelDto {
    @ApiProperty({ description: 'Exam model ID' })
    id: UUID;

    @ApiProperty({ description: 'Name of the exam model' })
    name: string;

    @ApiProperty({ description: 'Version of the exam model (A, B, C, D...)' })
    version: string;

    @ApiProperty({ description: 'Description of the exam model', required: false })
    description?: string;

    @ApiProperty({ description: 'Number of students assigned to this model' })
    assignedStudentCount: number;

    @ApiProperty({ description: 'Whether the model is active' })
    isActive: boolean;

    @ApiProperty({ description: 'Event ID' })
    eventId: UUID;

    @ApiProperty({ description: 'Array of file information', type: 'array' })
    files: {
        id: UUID;
        fileName: string;
        originalFileName: string;
        fileSize: number;
        mimeType: string;
        fileUrl: string;
    }[];

    @ApiProperty({ description: 'Creation date' })
    created_at: Date;

    @ApiProperty({ description: 'Last update date' })
    updated_at: Date;
}

export class ModelAssignmentRequest {
    @ApiProperty({ description: 'Exam model ID' })
    examModelId: UUID;

    @ApiProperty({ description: 'Array of student IDs', type: [String] })
    studentIds: UUID[];
}

export class AssignExamModelsRequest {
    @ApiProperty({ description: 'Event ID' })
    eventId: UUID;

    @ApiProperty({ description: 'Model assignments', type: [ModelAssignmentRequest] })
    assignments: ModelAssignmentRequest[];
}

@Injectable()
export class ExamModelService {
    constructor(
        @InjectRepository(ExamModel)
        private examModelRepository: Repository<ExamModel>,
        @InjectRepository(ExamModelFile)
        private examModelFileRepository: Repository<ExamModelFile>,
        @InjectRepository(ExamGroup)
        private examGroupRepository: Repository<ExamGroup>,
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        @InjectRepository(EventSchedule)
        private eventScheduleRepository: Repository<EventSchedule>,
        @InjectRepository(StudentEventSchedule)
        private studentEventScheduleRepository: Repository<StudentEventSchedule>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private fileService: FileService,
        private minioService: MinioService,
    ) { }

    /**
     * Create exam models with file uploads
     */
    async createExamModels(request: CreateExamModelRequest): Promise<ExamModelDto[]> {
        // Verify event exists
        const event = await this.eventRepository.findOne({
            where: { id: request.eventId },
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        const createdModels: ExamModel[] = [];

        // Create a single model with multiple files
        const version = String.fromCharCode(65 + 0); // Start with A

        // Create exam model
        const examModel = this.examModelRepository.create({
            name: request.name,
            version: version,
            description: request.description,
            eventId: request.eventId,
            assignedStudentCount: 0,
            isActive: true,
        });

        const savedModel = await this.examModelRepository.save(examModel);

        // Create file records for each uploaded file
        for (const file of request.files) {
            // Upload file using FileService
            const uploadedFile = await this.fileService.uploadFile(file, { prefix: 'exam-models' });

            // Create exam model file relationship record (only stores IDs)
            const examModelFile = this.examModelFileRepository.create({
                examModelId: savedModel.id,
                fileId: uploadedFile.id,
            });

            await this.examModelFileRepository.save(examModelFile);
        }

        createdModels.push(savedModel);

        return Promise.all(createdModels.map(model => this.mapToDto(model)));
    }

    /**
     * Get all exam models for an event
     */
    async getExamModelsForEvent(eventId: UUID): Promise<ExamModelDto[]> {
        const models = await this.examModelRepository.find({
            where: { eventId, isActive: true },
            order: { version: 'ASC' },
        });

        return Promise.all(models.map(model => this.mapToDto(model)));
    }

    /**
     * Assign exam models to students
     */
    async assignExamModelsToStudents(request: AssignExamModelsRequest): Promise<{ success: boolean; message: string }> {
        // Verify event exists
        const event = await this.eventRepository.findOne({
            where: { id: request.eventId },
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        // Process each assignment
        for (const assignment of request.assignments) {
            const examModel = await this.examModelRepository.findOne({
                where: { id: assignment.examModelId, eventId: request.eventId },
            });

            if (!examModel) {
                throw new NotFoundException(`Exam model ${assignment.examModelId} not found`);
            }

            // Update student event schedules with assigned exam model
            for (const studentId of assignment.studentIds) {
                // Find student's event schedule for this event
                const studentSchedules = await this.studentEventScheduleRepository.find({
                    where: { student_id: studentId },
                });

                for (const schedule of studentSchedules) {
                    const eventSchedule = await schedule.eventSchedule;
                    if (eventSchedule.eventId === request.eventId) {
                        // Get the first file URL for backward compatibility
                        const examModelFiles = await examModel.files;
                        const firstFileUrl = examModelFiles.length > 0
                            ? await this.minioService.getPresignedUrl((await examModelFiles[0].file).objectName, 3600)
                            : null;

                        await this.studentEventScheduleRepository.update(
                            { eventSchedule_id: schedule.eventSchedule_id, student_id: studentId },
                            {
                                examModel: examModel.version,
                                assignedExamModelUrl: firstFileUrl,
                            }
                        );
                        break;
                    }
                }
            }

            // Update assigned student count
            await this.examModelRepository.update(assignment.examModelId, {
                assignedStudentCount: assignment.studentIds.length,
            });
        }

        return {
            success: true,
            message: 'Exam models assigned successfully',
        };
    }

    /**
     * Get student's assigned exam model with presigned URLs
     */
    async getStudentAssignedExamModel(studentId: UUID, eventScheduleId: UUID): Promise<{
        examModel: ExamModelDto;
        files: { fileName: string; downloadUrl: string }[];
    }> {
        // Find student's event schedule
        const studentSchedule = await this.studentEventScheduleRepository.findOne({
            where: { student_id: studentId, eventSchedule_id: eventScheduleId },
        });

        if (!studentSchedule || !studentSchedule.examModel) {
            throw new NotFoundException('No exam model assigned to this student');
        }

        // Find the exam model by version
        const eventSchedule = await studentSchedule.eventSchedule;
        const examModel = await this.examModelRepository.findOne({
            where: {
                id: studentSchedule.examModel as UUID
            },
        });

        if (!examModel) {
            throw new NotFoundException('Assigned exam model not found');
        }

        const examModelFiles = await examModel.files;
        const fileUrls = await Promise.all(
            examModelFiles.map(async (examModelFile) => {
                const file = await examModelFile.file;
                return {
                    fileName: file.originalname,
                    downloadUrl: await this.minioService.getPresignedUrl(file.objectName, 3600), // 1 hour expiry
                };
            })
        );

        return {
            examModel: await this.mapToDto(examModel),
            files: fileUrls,
        };
    }

    /**
     * Delete exam model and all its files
     */
    async deleteExamModel(modelId: UUID): Promise<{ success: boolean; message: string }> {
        const model = await this.examModelRepository.findOne({
            where: { id: modelId },
        });

        if (!model) {
            throw new NotFoundException('Exam model not found');
        }

        // Get all file relationships for this model
        const examModelFiles = await model.files;

        // Delete files from storage
        for (const examModelFile of examModelFiles) {
            try {
                const file = await examModelFile.file;
                await this.minioService.deleteFile(file.objectName);
            } catch (error) {
                console.error(`Failed to delete file ${examModelFile.fileId}:`, error);
            }
        }

        // Delete file records
        await this.examModelFileRepository.delete({ examModelId: modelId });

        // Delete the model
        await this.examModelRepository.delete(modelId);

        return {
            success: true,
            message: 'Exam model deleted successfully',
        };
    }

    /**
     * Download specific exam model file
     */
    async downloadExamModelFile(modelId: UUID, fileId: UUID): Promise<{ downloadUrl: string; fileName: string }> {
        const examModelFile = await this.examModelFileRepository.findOne({
            where: { id: fileId, examModelId: modelId },
        });

        if (!examModelFile) {
            throw new NotFoundException('File not found');
        }

        const file = await examModelFile.file;
        const downloadUrl = await this.minioService.getPresignedUrl(file.objectName, 3600); // 1 hour expiry

        return {
            downloadUrl,
            fileName: file.originalname,
        };
    }

    /**
     * Get all files for an exam model with presigned URLs
     */
    async getExamModelFiles(modelId: UUID): Promise<{ fileName: string; downloadUrl: string; fileSize: number }[]> {
        const model = await this.examModelRepository.findOne({
            where: { id: modelId },
        });

        if (!model) {
            throw new NotFoundException('Exam model not found');
        }

        const examModelFiles = await model.files;

        return Promise.all(
            examModelFiles.map(async (examModelFile) => {
                const file = await examModelFile.file;
                return {
                    fileName: file.originalname,
                    downloadUrl: await this.minioService.getPresignedUrl(file.objectName, 3600), // 1 hour expiry
                    fileSize: file.size,
                };
            })
        );
    }

    /**
     * Map ExamModel entity to DTO with presigned URLs
     */
    private async mapToDto(model: ExamModel): Promise<ExamModelDto> {
        const examModelFiles = await model.files;

        const filesWithUrls = await Promise.all(
            examModelFiles.map(async (examModelFile) => {
                const file = await examModelFile.file;
                return {
                    id: examModelFile.id,
                    fileName: file.filename,
                    originalFileName: file.originalname,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    fileUrl: await this.minioService.getPresignedUrl(file.objectName, 3600), // 1 hour expiry
                };
            })
        );

        return {
            id: model.id,
            name: model.name,
            version: model.version,
            description: model.description,
            assignedStudentCount: model.assignedStudentCount,
            isActive: model.isActive,
            eventId: model.eventId,
            files: filesWithUrls,
            created_at: model.created_at,
            updated_at: model.updated_at,
        };
    }

    /**
     * Assign a random exam model to a student when they start an exam
     */
    async assignRandomExamModelToStudent(eventId: UUID, studentId: UUID): Promise<ExamModelDto> {
        // Get all active exam models for the event
        const examModels = await this.examModelRepository.find({
            where: {
                eventId
            },
            relations: ['files']
        });

        if (!examModels.length) {
            throw new NotFoundException('No active exam models found for this event');
        }

        // Get student's course group
        const studentSchedule = await this.studentEventScheduleRepository.findOne({
            where: {
                student_id: studentId,
                eventSchedule: {
                    eventId
                }
            },
            relations: ['eventSchedule']
        });

        if (!studentSchedule) {
            throw new NotFoundException('Student schedule not found');
        }

        // Get available models for the student's group
        const availableModels = examModels.filter(model =>
            model.assignedStudentCount < Math.ceil(examModels.length / 2) // Ensure even distribution
        );

        if (!availableModels.length) {
            // If no models are available with even distribution, use all models
            const randomModel = examModels[Math.floor(Math.random() * examModels.length)];
            await this.assignModelToStudent(randomModel.id, studentId);
            return this.mapToDto(randomModel);
        }

        // Assign a random model from available models
        const randomModel = availableModels[Math.floor(Math.random() * availableModels.length)];
        await this.assignModelToStudent(randomModel.id, studentId);
        return this.mapToDto(randomModel);
    }

    /**
     * Assign a specific exam model to a student
     */
    private async assignModelToStudent(modelId: UUID, studentId: UUID): Promise<void> {
        // Update the student's schedule with the assigned model
        await this.studentEventScheduleRepository.update(
            { student_id: studentId },
            { examModel: modelId }
        );

        // Increment the assigned student count for the model
        await this.examModelRepository.increment(
            { id: modelId },
            'assignedStudentCount',
            1
        );
    }
} 
