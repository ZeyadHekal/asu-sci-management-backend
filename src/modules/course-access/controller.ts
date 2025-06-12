import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBearerAuth
} from '@nestjs/swagger';
import { UUID } from 'crypto';
import { CourseAccessService } from './service';
import {
    CourseAccessPermissionDto,
    UserCourseAccessDto,
    CreateCourseAccessDto,
    UpdateCourseAccessDto,
    BulkUpdateCourseAccessDto,
    CourseAccessSummaryDto,
    AssistantListDto,
    GrantMultipleSectionsDto
} from './dtos';
import { CourseAccessSection } from 'src/database/courses/course-access.entity';
import { CurrentUser } from 'src/auth/decorators';
import { User } from 'src/database/users/user.entity';
import { RequirePrivileges } from 'src/privileges/guard/decorator';
import { PrivilegeCode } from 'src/db-seeder/data/privileges';

@ApiTags('course-access')
@ApiBearerAuth()
@Controller('course-access')
export class CourseAccessController {
    constructor(private readonly courseAccessService: CourseAccessService) { }

    @Get('courses/:courseId/summary')
    @RequirePrivileges({ or: [PrivilegeCode.MANAGE_COURSES, PrivilegeCode.TEACH_COURSE] })
    @ApiOperation({
        summary: 'Get course access summary',
        description: 'Get a summary of all user access permissions for a specific course'
    })
    @ApiParam({ name: 'courseId', description: 'Course ID', type: 'string' })
    @ApiResponse({ type: CourseAccessSummaryDto, status: 200, description: 'Course access summary retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Not Found - Course does not exist' })
    getCourseAccessSummary(
        @Param('courseId') courseId: UUID,
        @CurrentUser() user: User
    ): Promise<CourseAccessSummaryDto> {
        return this.courseAccessService.getCourseAccessSummary(courseId, user.id);
    }

    @Get('courses/:courseId/assistants')
    @RequirePrivileges({ or: [PrivilegeCode.MANAGE_COURSES, PrivilegeCode.TEACH_COURSE] })
    @ApiOperation({
        summary: 'Get assistants with permissions',
        description: 'Get all assistants who currently have any permissions for this course'
    })
    @ApiParam({ name: 'courseId', description: 'Course ID', type: 'string' })
    @ApiResponse({ type: [AssistantListDto], status: 200, description: 'Assistants with permissions retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Not Found - Course does not exist' })
    getAssistantsWithPermissions(
        @Param('courseId') courseId: UUID,
        @CurrentUser() user: User
    ): Promise<AssistantListDto[]> {
        return this.courseAccessService.getAssistantsWithPermissions(courseId, user.id);
    }

    @Get('courses/:courseId/available-assistants')
    @RequirePrivileges({ or: [PrivilegeCode.MANAGE_COURSES, PrivilegeCode.TEACH_COURSE] })
    @ApiOperation({
        summary: 'Get available assistants',
        description: 'Get all assistants who do not currently have any permissions for this course'
    })
    @ApiParam({ name: 'courseId', description: 'Course ID', type: 'string' })
    @ApiResponse({ type: [AssistantListDto], status: 200, description: 'Available assistants retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Not Found - Course does not exist' })
    getAvailableAssistants(
        @Param('courseId') courseId: UUID,
        @CurrentUser() user: User
    ): Promise<AssistantListDto[]> {
        return this.courseAccessService.getAvailableAssistants(courseId, user.id);
    }

    @Post('permissions')
    @RequirePrivileges({ or: [PrivilegeCode.MANAGE_COURSES, PrivilegeCode.TEACH_COURSE] })
    @ApiOperation({
        summary: 'Grant course access permission',
        description: 'Grant access permission to an assistant for a specific course section'
    })
    @ApiResponse({ type: CourseAccessPermissionDto, status: 201, description: 'Access permission granted successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid data or user does not have ASSIST_IN_COURSE privilege' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Not Found - Course or user does not exist' })
    grantCourseAccess(
        @Body() dto: CreateCourseAccessDto,
        @CurrentUser() user: User
    ): Promise<CourseAccessPermissionDto> {
        return this.courseAccessService.grantCourseAccess(dto, user.id);
    }

    @Put('permissions/:userId/:courseId/:section')
    @RequirePrivileges({ or: [PrivilegeCode.MANAGE_COURSES, PrivilegeCode.TEACH_COURSE] })
    @ApiOperation({
        summary: 'Update course access permission',
        description: 'Update access permission for an assistant for a specific course section'
    })
    @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
    @ApiParam({ name: 'courseId', description: 'Course ID', type: 'string' })
    @ApiParam({ name: 'section', enum: CourseAccessSection, description: 'Course section' })
    @ApiResponse({ type: CourseAccessPermissionDto, status: 200, description: 'Access permission updated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Not Found - Permission does not exist' })
    updateCourseAccess(
        @Param('userId') userId: UUID,
        @Param('courseId') courseId: UUID,
        @Param('section') section: CourseAccessSection,
        @Body() dto: UpdateCourseAccessDto,
        @CurrentUser() user: User
    ): Promise<CourseAccessPermissionDto> {
        return this.courseAccessService.updateCourseAccess(userId, courseId, section, dto, user.id);
    }

    @Delete('permissions/:userId/:courseId/:section')
    @RequirePrivileges({ or: [PrivilegeCode.MANAGE_COURSES, PrivilegeCode.TEACH_COURSE] })
    @ApiOperation({
        summary: 'Revoke course access permission',
        description: 'Revoke access permission from an assistant for a specific course section'
    })
    @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
    @ApiParam({ name: 'courseId', description: 'Course ID', type: 'string' })
    @ApiParam({ name: 'section', enum: CourseAccessSection, description: 'Course section' })
    @ApiResponse({ status: 204, description: 'Access permission revoked successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Not Found - Permission does not exist' })
    async revokeCourseAccess(
        @Param('userId') userId: UUID,
        @Param('courseId') courseId: UUID,
        @Param('section') section: CourseAccessSection,
        @CurrentUser() user: User
    ): Promise<void> {
        return this.courseAccessService.revokeCourseAccess(userId, courseId, section, user.id);
    }

    @Post('permissions/bulk')
    @RequirePrivileges({ or: [PrivilegeCode.MANAGE_COURSES, PrivilegeCode.TEACH_COURSE] })
    @ApiOperation({
        summary: 'Bulk update course access permissions',
        description: 'Update multiple access permissions at once'
    })
    @ApiResponse({ type: [CourseAccessPermissionDto], status: 201, description: 'Access permissions updated successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    bulkUpdateCourseAccess(
        @Body() dto: BulkUpdateCourseAccessDto,
        @CurrentUser() user: User
    ): Promise<CourseAccessPermissionDto[]> {
        return this.courseAccessService.bulkUpdateCourseAccess(dto, user.id);
    }

    @Post('permissions/grant-multiple-sections')
    @RequirePrivileges({ or: [PrivilegeCode.MANAGE_COURSES, PrivilegeCode.TEACH_COURSE] })
    @ApiOperation({
        summary: 'Grant access to multiple sections',
        description: 'Grant access permissions to an assistant for multiple course sections at once'
    })
    @ApiResponse({ type: [CourseAccessPermissionDto], status: 201, description: 'Access permissions granted successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid data or user does not have ASSIST_IN_COURSE privilege' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Not Found - Course or user does not exist' })
    grantMultipleSectionsAccess(
        @Body() dto: GrantMultipleSectionsDto,
        @CurrentUser() user: User
    ): Promise<CourseAccessPermissionDto[]> {
        return this.courseAccessService.grantMultipleSectionsAccess(
            dto.userId,
            dto.courseId,
            dto.sections,
            user.id
        );
    }

    @Delete('permissions/:userId/:courseId/all')
    @RequirePrivileges({ or: [PrivilegeCode.MANAGE_COURSES, PrivilegeCode.TEACH_COURSE] })
    @ApiOperation({
        summary: 'Revoke all permissions for user',
        description: 'Revoke all access permissions from an assistant for a course'
    })
    @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
    @ApiParam({ name: 'courseId', description: 'Course ID', type: 'string' })
    @ApiResponse({ status: 204, description: 'All access permissions revoked successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    @ApiResponse({ status: 404, description: 'Not Found - User or course does not exist' })
    async revokeAllUserAccess(
        @Param('userId') userId: UUID,
        @Param('courseId') courseId: UUID,
        @CurrentUser() user: User
    ): Promise<void> {
        return this.courseAccessService.revokeAllUserAccess(userId, courseId, user.id);
    }

    @Get('users/:userId/courses/:courseId')
    @RequirePrivileges({ or: [PrivilegeCode.MANAGE_COURSES, PrivilegeCode.TEACH_COURSE, PrivilegeCode.ASSIST_IN_COURSE] })
    @ApiOperation({
        summary: 'Get user course access',
        description: 'Get all access permissions for a specific user in a course'
    })
    @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
    @ApiParam({ name: 'courseId', description: 'Course ID', type: 'string' })
    @ApiResponse({ type: [CourseAccessPermissionDto], status: 200, description: 'User course access retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient privileges' })
    getUserCourseAccess(
        @Param('userId') userId: UUID,
        @Param('courseId') courseId: UUID
    ): Promise<CourseAccessPermissionDto[]> {
        return this.courseAccessService.getUserCourseAccess(userId, courseId);
    }

    @Get('check/:courseId/:section')
    @RequirePrivileges({ or: [PrivilegeCode.MANAGE_COURSES, PrivilegeCode.TEACH_COURSE, PrivilegeCode.ASSIST_IN_COURSE] })
    @ApiOperation({
        summary: 'Check section access',
        description: 'Check if current user has access to a specific course section'
    })
    @ApiParam({ name: 'courseId', description: 'Course ID', type: 'string' })
    @ApiParam({ name: 'section', enum: CourseAccessSection, description: 'Course section' })
    @ApiQuery({ name: 'action', enum: ['view', 'edit', 'delete'], required: false, description: 'Action to check (default: view)' })
    @ApiResponse({ type: Boolean, status: 200, description: 'Access check result' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async checkSectionAccess(
        @Param('courseId') courseId: UUID,
        @Param('section') section: CourseAccessSection,
        @Query('action') action: 'view' | 'edit' | 'delete' = 'view',
        @CurrentUser() user: User
    ): Promise<{ hasAccess: boolean }> {
        const hasAccess = await this.courseAccessService.hasAccessToSection(user.id, courseId, section, action);
        return { hasAccess };
    }
} 