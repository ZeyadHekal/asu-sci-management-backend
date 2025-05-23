import { Controller, Get, Post, Delete, Param, Body, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RequirePrivileges } from 'src/privileges/guard/decorator';
import { PrivilegeCode } from 'src/db-seeder/data/privileges';
import { UUID } from 'crypto';
import { ExamModelService, CreateExamModelRequest, ExamModelDto, AssignExamModelsRequest, UploadExamModelsDto } from './service';

@ApiTags('exam-models')
@Controller('exam-models')
export class ExamModelController {
    constructor(private readonly examModelService: ExamModelService) { }

    @Post('upload')
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Upload exam models for an event' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Upload exam model files',
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Name of the exam model' },
                description: { type: 'string', description: 'Description of the exam model' },
                eventId: { type: 'string', description: 'Event ID' },
                files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Exam model files'
                }
            },
            required: ['name', 'eventId', 'files']
        }
    })
    @ApiResponse({
        status: 201,
        description: 'Exam models uploaded successfully',
        type: [ExamModelDto]
    })
    @UseInterceptors(FilesInterceptor('files'))
    async uploadExamModels(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() body: { name: string; description?: string; eventId: UUID }
    ): Promise<ExamModelDto[]> {
        const request: CreateExamModelRequest = {
            name: body.name,
            description: body.description,
            eventId: body.eventId,
            files,
        };
        return this.examModelService.createExamModels(request);
    }

    @Get('event/:eventId')
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Get all exam models for an event' })
    @ApiParam({ name: 'eventId', description: 'Event ID' })
    @ApiResponse({
        status: 200,
        description: 'Exam models retrieved successfully',
        type: [ExamModelDto]
    })
    async getExamModelsForEvent(@Param('eventId') eventId: UUID): Promise<ExamModelDto[]> {
        return this.examModelService.getExamModelsForEvent(eventId);
    }

    @Get(':modelId/files')
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Get all files for an exam model with presigned URLs' })
    @ApiParam({ name: 'modelId', description: 'Exam Model ID' })
    @ApiResponse({
        status: 200,
        description: 'Exam model files retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    fileName: { type: 'string' },
                    downloadUrl: { type: 'string' },
                    fileSize: { type: 'number' }
                }
            }
        }
    })
    async getExamModelFiles(@Param('modelId') modelId: UUID): Promise<{ fileName: string; downloadUrl: string; fileSize: number }[]> {
        return this.examModelService.getExamModelFiles(modelId);
    }

    @Get(':modelId/file/:fileId/download')
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Get presigned URL for specific exam model file' })
    @ApiParam({ name: 'modelId', description: 'Exam Model ID' })
    @ApiParam({ name: 'fileId', description: 'File ID' })
    @ApiResponse({
        status: 200,
        description: 'Presigned URL generated successfully',
        schema: {
            type: 'object',
            properties: {
                downloadUrl: { type: 'string' },
                fileName: { type: 'string' }
            }
        }
    })
    async downloadExamModelFile(
        @Param('modelId') modelId: UUID,
        @Param('fileId') fileId: UUID
    ): Promise<{ downloadUrl: string; fileName: string }> {
        return this.examModelService.downloadExamModelFile(modelId, fileId);
    }

    @Get('student/:studentId/schedule/:scheduleId')
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Get student assigned exam model with files' })
    @ApiParam({ name: 'studentId', description: 'Student ID' })
    @ApiParam({ name: 'scheduleId', description: 'Event Schedule ID' })
    @ApiResponse({
        status: 200,
        description: 'Student assigned exam model retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                examModel: { $ref: '#/components/schemas/ExamModelDto' },
                files: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            fileName: { type: 'string' },
                            downloadUrl: { type: 'string' }
                        }
                    }
                }
            }
        }
    })
    async getStudentAssignedExamModel(
        @Param('studentId') studentId: UUID,
        @Param('scheduleId') scheduleId: UUID
    ): Promise<{ examModel: ExamModelDto; files: { fileName: string; downloadUrl: string }[] }> {
        return this.examModelService.getStudentAssignedExamModel(studentId, scheduleId);
    }

    @Post('assign')
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Assign exam models to students' })
    @ApiResponse({
        status: 200,
        description: 'Exam models assigned successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' }
            }
        }
    })
    async assignExamModelsToStudents(@Body() request: AssignExamModelsRequest): Promise<{ success: boolean; message: string }> {
        return this.examModelService.assignExamModelsToStudents(request);
    }

    @Delete(':modelId')
    @RequirePrivileges({ and: [PrivilegeCode.MANAGE_SYSTEM] })
    @ApiOperation({ summary: 'Delete an exam model' })
    @ApiParam({ name: 'modelId', description: 'Exam Model ID' })
    @ApiResponse({
        status: 200,
        description: 'Exam model deleted successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' }
            }
        }
    })
    async deleteExamModel(@Param('modelId') modelId: UUID): Promise<{ success: boolean; message: string }> {
        return this.examModelService.deleteExamModel(modelId);
    }

    @Post('assign/:eventId/student/:studentId')
    @RequirePrivileges({ and: [PrivilegeCode.STUDY_COURSE] })
    @ApiOperation({ summary: 'Assign a random exam model to a student' })
    @ApiParam({ name: 'eventId', description: 'Event ID' })
    @ApiParam({ name: 'studentId', description: 'Student ID' })
    @ApiResponse({
        status: 200,
        description: 'Exam model assigned successfully',
        type: ExamModelDto
    })
    async assignRandomExamModel(
        @Param('eventId') eventId: UUID,
        @Param('studentId') studentId: UUID
    ): Promise<ExamModelDto> {
        return this.examModelService.assignRandomExamModelToStudent(eventId, studentId);
    }
} 
