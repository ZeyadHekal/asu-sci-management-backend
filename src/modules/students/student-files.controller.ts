import { Controller, Post, Get, Delete, Param, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { RequirePrivileges } from 'src/privileges/guard/decorator';
import { PrivilegeCode } from 'src/db-seeder/data/privileges';
import { StudentFilesService } from './student-files.service';
import { StudentsFiles } from '../../database/students/student_files.entity';
import { UUID } from 'crypto';

@ApiTags('student-files')
@Controller('student-files')
export class StudentFilesController {
    constructor(private readonly studentFilesService: StudentFilesService) { }

    @Post('upload/:studentId/:courseId/:eventId')
    @RequirePrivileges({ and: [PrivilegeCode.STUDY_COURSE] })
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload a file for student exam submission' })
    @ApiParam({ name: 'studentId', description: 'Student ID' })
    @ApiParam({ name: 'courseId', description: 'Course ID' })
    @ApiParam({ name: 'eventId', description: 'Event ID' })
    @ApiResponse({
        status: 201,
        description: 'File uploaded successfully',
        type: StudentsFiles
    })
    async uploadExamFile(
        @Param('studentId') studentId: UUID,
        @Param('courseId') courseId: UUID,
        @Param('eventId') eventId: UUID,
        @UploadedFile() file: Express.Multer.File
    ): Promise<StudentsFiles> {
        return this.studentFilesService.uploadExamFile(
            studentId,
            courseId,
            eventId,
            file
        );
    }

    @Get(':studentId/:eventId')
    @RequirePrivileges({ and: [PrivilegeCode.STUDY_COURSE] })
    @ApiOperation({ summary: 'Get all files submitted by a student for an exam' })
    @ApiParam({ name: 'studentId', description: 'Student ID' })
    @ApiParam({ name: 'eventId', description: 'Event ID' })
    @ApiResponse({
        status: 200,
        description: 'Files retrieved successfully',
        type: [StudentsFiles]
    })
    async getStudentExamFiles(
        @Param('studentId') studentId: UUID,
        @Param('eventId') eventId: UUID
    ): Promise<StudentsFiles[]> {
        return this.studentFilesService.getStudentExamFiles(studentId, eventId);
    }

    @Delete(':fileId')
    @RequirePrivileges({ and: [PrivilegeCode.STUDY_COURSE] })
    @ApiOperation({ summary: 'Delete a student\'s submitted file' })
    @ApiParam({ name: 'fileId', description: 'File ID' })
    @ApiResponse({
        status: 200,
        description: 'File deleted successfully'
    })
    async deleteStudentFile(@Param('fileId') fileId: number): Promise<void> {
        return this.studentFilesService.deleteStudentFile(fileId);
    }
} 