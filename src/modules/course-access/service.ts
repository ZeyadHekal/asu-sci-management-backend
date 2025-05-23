import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UUID } from 'crypto';
import { CourseAccessPermission, CourseAccessSection } from 'src/database/courses/course-access.entity';
import { User } from 'src/database/users/user.entity';
import { Course } from 'src/database/courses/course.entity';
import {
    CourseAccessPermissionDto,
    UserCourseAccessDto,
    CreateCourseAccessDto,
    UpdateCourseAccessDto,
    BulkUpdateCourseAccessDto,
    CourseAccessSummaryDto,
    AssistantListDto
} from './dtos';
import { transformToInstance } from 'src/base/transformToInstance';
import { PrivilegeCode } from 'src/db-seeder/data/privileges';

@Injectable()
export class CourseAccessService {
    constructor(
        @InjectRepository(CourseAccessPermission)
        private readonly courseAccessRepository: Repository<CourseAccessPermission>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Course)
        private readonly courseRepository: Repository<Course>,
    ) { }

    async getCourseAccessSummary(courseId: UUID, currentUserId: UUID): Promise<CourseAccessSummaryDto> {
        // Verify user has permission to manage this course
        await this.validateCourseManagementAccess(courseId, currentUserId);

        // Get course details
        const course = await this.courseRepository.findOne({
            where: { id: courseId },
            relations: ['users'] // doctors
        });

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        // Get all access permissions for this course
        const permissions = await this.courseAccessRepository.find({
            where: { courseId },
            relations: ['user']
        });

        // Group permissions by user
        const userAccessMap = new Map<UUID, UserCourseAccessDto>();

        for (const permission of permissions) {
            const user = await permission.user;

            if (!userAccessMap.has(user.id)) {
                userAccessMap.set(user.id, {
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email || '',
                    permissions: []
                });
            }

            userAccessMap.get(user.id)!.permissions.push(
                transformToInstance(CourseAccessPermissionDto, permission)
            );
        }

        return {
            courseId,
            courseName: course.name,
            courseCode: `${course.subjectCode}${course.courseNumber}`,
            userAccess: Array.from(userAccessMap.values())
        };
    }

    async getAssistantsWithPermissions(courseId: UUID, currentUserId: UUID): Promise<AssistantListDto[]> {
        // Verify user has permission to manage this course
        await this.validateCourseManagementAccess(courseId, currentUserId);

        // Get all permissions for this course grouped by user
        const permissions = await this.courseAccessRepository.find({
            where: { courseId },
            relations: ['user']
        });

        // Group permissions by user
        const userPermissionsMap = new Map<UUID, { user: User; permissions: CourseAccessPermission[] }>();

        for (const permission of permissions) {
            const user = await permission.user;
            const userId = user.id;

            if (!userPermissionsMap.has(userId)) {
                userPermissionsMap.set(userId, { user, permissions: [] });
            }
            userPermissionsMap.get(userId)!.permissions.push(permission);
        }

        // Build response
        const result: AssistantListDto[] = [];
        for (const [userId, { user, permissions }] of userPermissionsMap) {
            result.push({
                id: user.id,
                name: user.name,
                email: user.email || '',
                username: user.username,
                hasAccess: permissions.length > 0,
                permissions: permissions.map(p => transformToInstance(CourseAccessPermissionDto, p))
            });
        }

        return result;
    }

    async getAvailableAssistants(courseId: UUID, currentUserId: UUID): Promise<AssistantListDto[]> {
        // Verify user has permission to manage this course
        await this.validateCourseManagementAccess(courseId, currentUserId);

        // Get all users with ASSIST_IN_COURSE privilege (either individually or through user type)
        const assistants = await this.userRepository
            .createQueryBuilder('user')
            .where(qb => {
                // Users with individual ASSIST_IN_COURSE privilege
                const individualPrivilegeExists = qb.subQuery()
                    .select('1')
                    .from('user_privilege', 'up')
                    .innerJoin('privileges', 'p', 'p.id = up.privilege_id')
                    .where('up.user_id = user.id')
                    .andWhere('p.code = :code')
                    .getQuery();

                // Users with ASSIST_IN_COURSE privilege through user type
                const userTypePrivilegeExists = qb.subQuery()
                    .select('1')
                    .from('user_type_privilege', 'utp')
                    .innerJoin('privileges', 'tp', 'tp.id = utp.privilege_id')
                    .where('utp.user_type_id = user.user_type_id')
                    .andWhere('tp.code = :code')
                    .getQuery();

                return `EXISTS (${individualPrivilegeExists}) OR EXISTS (${userTypePrivilegeExists})`;
            })
            .setParameter('code', PrivilegeCode.ASSIST_IN_COURSE)
            .getMany();

        // Get users who already have permissions for this course
        const existingPermissions = await this.courseAccessRepository.find({
            where: { courseId },
            select: ['userId']
        });
        const usersWithPermissions = new Set(existingPermissions.map(p => p.userId));

        // Filter out users who already have permissions
        const availableAssistants = assistants.filter(assistant =>
            !usersWithPermissions.has(assistant.id)
        );

        // Build response
        return availableAssistants.map(assistant => ({
            id: assistant.id,
            name: assistant.name,
            email: assistant.email || '',
            username: assistant.username,
            hasAccess: false,
            permissions: [] as CourseAccessPermissionDto[]
        }));
    }

    async grantCourseAccess(dto: CreateCourseAccessDto, grantedBy: UUID): Promise<CourseAccessPermissionDto> {
        // Verify the granter has permission to manage this course
        await this.validateCourseManagementAccess(dto.courseId, grantedBy);

        // Verify the user exists and has ASSIST_IN_COURSE privilege
        await this.validateAssistantAccess(dto.userId);

        // Check if permission already exists
        const existingPermission = await this.courseAccessRepository.findOne({
            where: {
                userId: dto.userId,
                courseId: dto.courseId,
                section: dto.section
            }
        });

        if (existingPermission) {
            // Update existing permission
            existingPermission.canView = dto.canView;
            existingPermission.canEdit = dto.canEdit;
            existingPermission.canDelete = dto.canDelete;
            existingPermission.grantedBy = grantedBy;

            const updated = await this.courseAccessRepository.save(existingPermission);
            return transformToInstance(CourseAccessPermissionDto, updated);
        }

        // Create new permission
        const permission = this.courseAccessRepository.create({
            userId: dto.userId,
            courseId: dto.courseId,
            section: dto.section,
            canView: dto.canView,
            canEdit: dto.canEdit,
            canDelete: dto.canDelete,
            grantedBy
        });

        const saved = await this.courseAccessRepository.save(permission);
        return transformToInstance(CourseAccessPermissionDto, saved);
    }

    async updateCourseAccess(
        userId: UUID,
        courseId: UUID,
        section: CourseAccessSection,
        dto: UpdateCourseAccessDto,
        updatedBy: UUID
    ): Promise<CourseAccessPermissionDto> {
        // Verify the updater has permission to manage this course
        await this.validateCourseManagementAccess(courseId, updatedBy);

        const permission = await this.courseAccessRepository.findOne({
            where: { userId, courseId, section }
        });

        if (!permission) {
            throw new NotFoundException('Access permission not found');
        }

        permission.canView = dto.canView;
        permission.canEdit = dto.canEdit;
        permission.canDelete = dto.canDelete;
        permission.grantedBy = updatedBy;

        const updated = await this.courseAccessRepository.save(permission);
        return transformToInstance(CourseAccessPermissionDto, updated);
    }

    async revokeCourseAccess(
        userId: UUID,
        courseId: UUID,
        section: CourseAccessSection,
        revokedBy: UUID
    ): Promise<void> {
        // Verify the revoker has permission to manage this course
        await this.validateCourseManagementAccess(courseId, revokedBy);

        const result = await this.courseAccessRepository.delete({
            userId,
            courseId,
            section
        });

        if (result.affected === 0) {
            throw new NotFoundException('Access permission not found');
        }
    }

    async bulkUpdateCourseAccess(dto: BulkUpdateCourseAccessDto, updatedBy: UUID): Promise<CourseAccessPermissionDto[]> {
        const results: CourseAccessPermissionDto[] = [];

        for (const permissionDto of dto.permissions) {
            // Verify the updater has permission to manage this course
            await this.validateCourseManagementAccess(permissionDto.courseId, updatedBy);

            const result = await this.grantCourseAccess(permissionDto, updatedBy);
            results.push(result);
        }

        return results;
    }

    async grantMultipleSectionsAccess(
        userId: UUID,
        courseId: UUID,
        sections: Array<{ section: CourseAccessSection; canView: boolean; canEdit: boolean; canDelete: boolean }>,
        grantedBy: UUID
    ): Promise<CourseAccessPermissionDto[]> {
        // Verify the granter has permission to manage this course
        await this.validateCourseManagementAccess(courseId, grantedBy);

        // Verify the user exists and has ASSIST_IN_COURSE privilege
        await this.validateAssistantAccess(userId);

        const results: CourseAccessPermissionDto[] = [];

        for (const sectionData of sections) {
            const result = await this.grantCourseAccess({
                userId,
                courseId,
                section: sectionData.section,
                canView: sectionData.canView,
                canEdit: sectionData.canEdit,
                canDelete: sectionData.canDelete
            }, grantedBy);
            results.push(result);
        }

        return results;
    }

    async revokeAllUserAccess(userId: UUID, courseId: UUID, revokedBy: UUID): Promise<void> {
        // Verify the revoker has permission to manage this course
        await this.validateCourseManagementAccess(courseId, revokedBy);

        await this.courseAccessRepository.delete({
            userId,
            courseId
        });
    }

    async getUserCourseAccess(userId: UUID, courseId: UUID): Promise<CourseAccessPermissionDto[]> {
        const permissions = await this.courseAccessRepository.find({
            where: { userId, courseId }
        });

        return permissions.map(permission =>
            transformToInstance(CourseAccessPermissionDto, permission)
        );
    }

    async hasAccessToSection(
        userId: UUID,
        courseId: UUID,
        section: CourseAccessSection,
        action: 'view' | 'edit' | 'delete' = 'view'
    ): Promise<boolean> {
        // Check if user has MANAGE_COURSES privilege (full access)
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['userType', 'userType.userTypePrivileges', 'userPrivileges']
        });

        if (!user) {
            return false;
        }

        const userPrivileges = await user.getUserPrivileges();
        if (userPrivileges[PrivilegeCode.MANAGE_COURSES]) {
            return true;
        }

        // Check if user is a doctor of this course
        const isDoctorOfCourse = await this.courseRepository
            .createQueryBuilder('course')
            .innerJoin('course.users', 'doctor')
            .where('course.id = :courseId AND doctor.id = :userId', { courseId, userId })
            .getCount();

        if (isDoctorOfCourse > 0) {
            return true;
        }

        // Check specific course access permission
        const permission = await this.courseAccessRepository.findOne({
            where: { userId, courseId, section }
        });

        if (!permission) {
            return false;
        }

        switch (action) {
            case 'view':
                return permission.canView;
            case 'edit':
                return permission.canEdit;
            case 'delete':
                return permission.canDelete;
            default:
                return false;
        }
    }

    private async validateCourseManagementAccess(courseId: UUID, userId: UUID): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['userType', 'userType.userTypePrivileges', 'userPrivileges']
        });

        if (!user) {
            throw new ForbiddenException('User not found');
        }

        const userPrivileges = await user.getUserPrivileges();

        // Check if user has MANAGE_COURSES privilege
        if (userPrivileges[PrivilegeCode.MANAGE_COURSES]) {
            return;
        }

        // Check if user is a doctor of this course
        const isDoctorOfCourse = await this.courseRepository
            .createQueryBuilder('course')
            .innerJoin('course.users', 'doctor')
            .where('course.id = :courseId AND doctor.id = :userId', { courseId, userId })
            .getCount();

        if (isDoctorOfCourse === 0) {
            throw new ForbiddenException('You do not have permission to manage access for this course');
        }
    }

    private async validateAssistantAccess(userId: UUID): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['userType', 'userType.userTypePrivileges', 'userPrivileges']
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        const userPrivileges = await user.getUserPrivileges();

        if (!userPrivileges[PrivilegeCode.ASSIST_IN_COURSE]) {
            throw new BadRequestException('User must have ASSIST_IN_COURSE privilege to be granted course access');
        }
    }
} 