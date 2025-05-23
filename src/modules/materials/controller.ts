import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UploadedFiles, UseInterceptors, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UUID } from 'crypto';
import { MaterialService } from './service';
import { CreateMaterialDto, UpdateMaterialDto, MaterialDto, MaterialListDto } from './dtos';
import { RequirePrivileges } from 'src/privileges/guard/decorator';
import { PrivilegeCode } from 'src/db-seeder/data/privileges';
import { CurrentUser } from 'src/auth/decorators';
import { User } from 'src/database/users/user.entity';

@ApiBearerAuth()
@ApiTags('materials')
@Controller('materials')
export class MaterialController {
    constructor(private readonly materialService: MaterialService) { }

    @Get('course/:courseId')
    @RequirePrivileges({
        or: [
            PrivilegeCode.MANAGE_COURSES,
            PrivilegeCode.TEACH_COURSE,
            PrivilegeCode.ASSIST_IN_COURSE,
            PrivilegeCode.STUDY_COURSE
        ]
    })
    @ApiOperation({ summary: 'Get course materials', description: 'Retrieve all materials for a specific course' })
    @ApiParam({ name: 'courseId', description: 'Course ID', type: 'string' })
    @ApiResponse({ type: [MaterialListDto], status: 200, description: 'Course materials retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    async getCourseMaterials(
        @Param('courseId') courseId: UUID,
        @CurrentUser() user: User
    ): Promise<MaterialListDto[]> {
        return this.materialService.getCourseMaterials(courseId, user);
    }

    @Post('course/:courseId')
    @RequirePrivileges({ or: [PrivilegeCode.MANAGE_COURSES, PrivilegeCode.TEACH_COURSE] })
    @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 10 }]))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload course material', description: 'Upload files as course materials' })
    @ApiParam({ name: 'courseId', description: 'Course ID', type: 'string' })
    @ApiResponse({ type: MaterialDto, status: 201, description: 'Material uploaded successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    async uploadMaterial(
        @Param('courseId') courseId: UUID,
        @Body() createDto: CreateMaterialDto,
        @UploadedFiles() files: { files?: Express.Multer.File[] },
        @CurrentUser() user: User
    ): Promise<MaterialDto> {
        return this.materialService.uploadMaterial(courseId, createDto, files.files || [], user);
    }

    @Get(':materialId/download')
    @RequirePrivileges({
        or: [
            PrivilegeCode.MANAGE_COURSES,
            PrivilegeCode.TEACH_COURSE,
            PrivilegeCode.ASSIST_IN_COURSE,
            PrivilegeCode.STUDY_COURSE
        ]
    })
    @ApiOperation({ summary: 'Download material', description: 'Download a specific material file' })
    @ApiParam({ name: 'materialId', description: 'Material ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'File downloaded successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Material not found' })
    async downloadMaterial(
        @Param('materialId') materialId: UUID,
        @CurrentUser() user: User,
        @Res() res: Response
    ): Promise<void> {
        await this.materialService.downloadMaterial(materialId, user, res);
    }

    @Get(':materialId/download-url')
    @RequirePrivileges({
        or: [
            PrivilegeCode.MANAGE_COURSES,
            PrivilegeCode.TEACH_COURSE,
            PrivilegeCode.ASSIST_IN_COURSE,
            PrivilegeCode.STUDY_COURSE
        ]
    })
    @ApiOperation({ summary: 'Get material download URL', description: 'Get presigned URL for downloading material' })
    @ApiParam({ name: 'materialId', description: 'Material ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Download URL retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Material not found' })
    async getMaterialDownloadUrl(
        @Param('materialId') materialId: UUID,
        @CurrentUser() user: User
    ): Promise<{ downloadUrl: string; fileName: string }> {
        return this.materialService.getMaterialDownloadUrl(materialId, user);
    }

    @Delete(':materialId')
    @RequirePrivileges({ or: [PrivilegeCode.MANAGE_COURSES, PrivilegeCode.TEACH_COURSE] })
    @ApiOperation({ summary: 'Delete material', description: 'Delete a course material' })
    @ApiParam({ name: 'materialId', description: 'Material ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Material deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Material not found' })
    async deleteMaterial(
        @Param('materialId') materialId: UUID,
        @CurrentUser() user: User
    ): Promise<{ message: string }> {
        return this.materialService.deleteMaterial(materialId, user);
    }

    @Patch(':materialId')
    @RequirePrivileges({ or: [PrivilegeCode.MANAGE_COURSES, PrivilegeCode.TEACH_COURSE] })
    @ApiOperation({ summary: 'Update material', description: 'Update material information' })
    @ApiParam({ name: 'materialId', description: 'Material ID', type: 'string' })
    @ApiResponse({ type: MaterialDto, status: 200, description: 'Material updated successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Material not found' })
    async updateMaterial(
        @Param('materialId') materialId: UUID,
        @Body() updateDto: UpdateMaterialDto,
        @CurrentUser() user: User
    ): Promise<MaterialDto> {
        return this.materialService.updateMaterial(materialId, updateDto, user);
    }

    @Patch(':materialId/toggle-visibility')
    @RequirePrivileges({ or: [PrivilegeCode.MANAGE_COURSES, PrivilegeCode.TEACH_COURSE] })
    @ApiOperation({ summary: 'Toggle material visibility', description: 'Toggle hide/show status of a material' })
    @ApiParam({ name: 'materialId', description: 'Material ID', type: 'string' })
    @ApiResponse({ type: MaterialDto, status: 200, description: 'Material visibility toggled successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Material not found' })
    async toggleMaterialVisibility(
        @Param('materialId') materialId: UUID,
        @CurrentUser() user: User
    ): Promise<MaterialDto> {
        return this.materialService.toggleMaterialVisibility(materialId, user);
    }
} 