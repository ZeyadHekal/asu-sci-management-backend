import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentsFiles } from '../../database/students/student_files.entity';
import { File } from '../files/entities/file.entity';
import { FileService } from '../files/file.service';
import { UUID } from 'crypto';

@Injectable()
export class StudentFilesService {
    constructor(
        @InjectRepository(StudentsFiles)
        private readonly studentFilesRepository: Repository<StudentsFiles>,
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        private readonly fileService: FileService
    ) { }

    /**
     * Upload a file for a student's exam submission
     */
    async uploadExamFile(
        studentId: UUID,
        courseId: UUID,
        eventId: UUID,
        file: Express.Multer.File
    ): Promise<StudentsFiles> {
        // Upload file using FileService
        const uploadedFile = await this.fileService.uploadFile(file, { prefix: 'exam-submissions' });

        // Create file record
        const fileRecord = this.fileRepository.create({
            filename: uploadedFile.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            objectName: uploadedFile.objectName,
            prefix: 'exam-submissions',
            bucket: 'exam-files',
            isPublic: false
        });

        const savedFile = await this.fileRepository.save(fileRecord);

        // Create student file record
        const studentFile = this.studentFilesRepository.create({
            studentId,
            courseId,
            eventId,
            materialId: null,
            fileId: savedFile.id,
            date: new Date()
        });

        return this.studentFilesRepository.save(studentFile);
    }

    /**
     * Get all files submitted by a student for an exam
     */
    async getStudentExamFiles(
        studentId: UUID,
        eventId: UUID
    ): Promise<StudentsFiles[]> {
        return this.studentFilesRepository.find({
            where: {
                studentId,
                eventId
            },
            relations: ['file']
        });
    }

    /**
     * Get a specific file by student ID, event ID, and file ID for validation
     */
    async getStudentFileByIds(
        studentId: UUID,
        eventId: UUID,
        fileId: number
    ): Promise<StudentsFiles | null> {
        return this.studentFilesRepository.findOne({
            where: {
                studentId,
                eventId,
                fileId
            }
        });
    }

    /**
     * Soft delete a student's submitted file
     */
    async deleteStudentFile(fileId: number): Promise<void> {
        const result = await this.studentFilesRepository.softDelete({ fileId });
        if (result.affected === 0) {
            throw new NotFoundException('File not found');
        }
    }
} 