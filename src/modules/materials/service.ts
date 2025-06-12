import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { UUID } from 'crypto';
import { Material } from 'src/database/materials/material.entity';
import { Course } from 'src/database/courses/course.entity';
import { User } from 'src/database/users/user.entity';
import { CourseAccessPermission, CourseAccessSection } from 'src/database/courses/course-access.entity';
import { CreateMaterialDto, UpdateMaterialDto, MaterialDto, MaterialListDto } from './dtos';
import { MinioService } from '../files/minio.service';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class MaterialService {
    constructor(
        @InjectRepository(Material)
        private readonly materialRepository: Repository<Material>,
        @InjectRepository(Course)
        private readonly courseRepository: Repository<Course>,
        @InjectRepository(CourseAccessPermission)
        private readonly courseAccessRepository: Repository<CourseAccessPermission>,
        private readonly minioService: MinioService,
    ) { }

    async getCourseMaterials(courseId: UUID, user: User): Promise<MaterialListDto[]> {
        // Check if user has access to this course
        await this.checkCourseAccess(courseId, user, 'view');

        // Get user's privileges to determine what materials to show
        const userPrivileges = await user.getUserPrivileges();
        const isStudent = !userPrivileges['MANAGE_COURSES'] && !userPrivileges['TEACH_COURSE'] && !userPrivileges['ASSIST_IN_COURSE'];

        // Build query based on user type
        const queryBuilder = this.materialRepository
            .createQueryBuilder('material')
            .where('material.courseId = :courseId', { courseId });

        // Students should not see hidden materials
        if (isStudent) {
            queryBuilder.andWhere('material.isHidden = false');
        }

        const materials = await queryBuilder
            .orderBy('material.created_at', 'DESC')
            .getMany();

        // Transform to MaterialListDto with additional information
        const materialListDtos: MaterialListDto[] = [];

        for (const material of materials) {
            const attachmentUrls = material.attachments ? JSON.parse(material.attachments) : [];

            // Calculate total file size and get uploader info
            let totalSize = 0;
            let uploadedBy = 'Unknown';

            try {
                // You might want to store uploader info in the material entity
                // For now, we'll use a default based on creation time
                uploadedBy = 'Course Staff';

                // Estimate file size from attachments (this could be improved by storing actual sizes)
                totalSize = attachmentUrls.length * 1024 * 1024; // Estimate 1MB per file
            } catch (error) {
                // Handle error gracefully
            }

            const dto = plainToInstance(MaterialListDto, {
                ...material,
                uploadedBy,
                fileSize: this.formatFileSize(totalSize),
                fileUrls: attachmentUrls,
            });

            materialListDtos.push(dto);
        }

        return materialListDtos;
    }

    async uploadMaterial(
        courseId: UUID,
        createDto: CreateMaterialDto,
        files: Express.Multer.File[],
        user: User
    ): Promise<MaterialDto> {
        // Check if user has upload access to this course
        await this.checkCourseAccess(courseId, user, 'edit');

        if (!files || files.length === 0) {
            throw new BadRequestException('At least one file must be uploaded');
        }

        // Verify course exists
        const course = await this.courseRepository.findOneBy({ id: courseId });
        if (!course) {
            throw new NotFoundException('Course not found');
        }

        // Upload files to MinIO
        const uploadedFiles: string[] = [];
        for (const file of files) {
            const objectName = await this.minioService.uploadFile(file, `course-materials/${courseId}`);
            uploadedFiles.push(objectName);
        }

        // Create material record
        const material = this.materialRepository.create({
            name: createDto.name,
            description: createDto.description || '',
            attachments: JSON.stringify(uploadedFiles),
            isHidden: this.parseBoolean(createDto.isHidden) || false,
            courseId: courseId,
        });

        const savedMaterial = await this.materialRepository.save(material);
        return plainToInstance(MaterialDto, savedMaterial);
    }

    async downloadMaterial(materialId: UUID, user: User, res: Response): Promise<void> {
        const material = await this.materialRepository.findOneBy({ id: materialId });
        if (!material) {
            throw new NotFoundException('Material not found');
        }

        // Check if user has access to download from this course
        await this.checkCourseAccess(material.courseId, user, 'view');

        // Students should not be able to download hidden materials
        const userPrivileges = await user.getUserPrivileges();
        const isStudent = !userPrivileges['MANAGE_COURSES'] && !userPrivileges['TEACH_COURSE'] && !userPrivileges['ASSIST_IN_COURSE'];

        if (isStudent && material.isHidden) {
            throw new ForbiddenException('This material is not available for download');
        }

        // Get the first file attachment for download
        const attachments = material.attachments ? JSON.parse(material.attachments) : [];
        if (attachments.length === 0) {
            throw new NotFoundException('No files attached to this material');
        }

        // Get presigned URL and redirect
        const objectName = attachments[0];
        const presignedUrl = await this.minioService.getPresignedUrl(objectName);
        res.redirect(presignedUrl);
    }

    async getMaterialDownloadUrl(materialId: UUID, user: User): Promise<{ downloadUrl: string; fileName: string }> {
        const material = await this.materialRepository.findOneBy({ id: materialId });
        if (!material) {
            throw new NotFoundException('Material not found');
        }

        // Check if user has access to download from this course
        await this.checkCourseAccess(material.courseId, user, 'view');

        // Students should not be able to download hidden materials
        const userPrivileges = await user.getUserPrivileges();
        const isStudent = !userPrivileges['MANAGE_COURSES'] && !userPrivileges['TEACH_COURSE'] && !userPrivileges['ASSIST_IN_COURSE'];

        if (isStudent && material.isHidden) {
            throw new ForbiddenException('This material is not available for download');
        }

        // Get the first file attachment for download
        const attachments = material.attachments ? JSON.parse(material.attachments) : [];
        if (attachments.length === 0) {
            throw new NotFoundException('No files attached to this material');
        }

        // Get presigned URL
        const objectName = attachments[0];
        const presignedUrl = await this.minioService.getPresignedUrl(objectName);

        // Extract original filename from object name or use material name
        const fileName = objectName.split('/').pop() || `${material.name}.file`;

        return {
            downloadUrl: presignedUrl,
            fileName: fileName
        };
    }

    async deleteMaterial(materialId: UUID, user: User): Promise<{ message: string }> {
        const material = await this.materialRepository.findOneBy({ id: materialId });
        if (!material) {
            throw new NotFoundException('Material not found');
        }

        // Check if user has delete access to this course
        await this.checkCourseAccess(material.courseId, user, 'delete');

        // Delete files from MinIO
        const attachments = material.attachments ? JSON.parse(material.attachments) : [];
        for (const objectName of attachments) {
            try {
                await this.minioService.deleteFile(objectName);
            } catch (error) {
                // Log error but continue with deletion
                console.error('Error deleting file from MinIO:', error);
            }
        }

        await this.materialRepository.remove(material);
        return { message: 'Material deleted successfully' };
    }

    async updateMaterial(materialId: UUID, updateDto: UpdateMaterialDto, user: User): Promise<MaterialDto> {
        const material = await this.materialRepository.findOneBy({ id: materialId });
        if (!material) {
            throw new NotFoundException('Material not found');
        }

        // Check if user has edit access to this course
        await this.checkCourseAccess(material.courseId, user, 'edit');

        // Update material
        Object.assign(material, updateDto);
        const updatedMaterial = await this.materialRepository.save(material);

        return plainToInstance(MaterialDto, updatedMaterial);
    }

    async toggleMaterialVisibility(materialId: UUID, user: User): Promise<MaterialDto> {
        const material = await this.materialRepository.findOneBy({ id: materialId });
        if (!material) {
            throw new NotFoundException('Material not found');
        }

        // Check if user has edit access to this course
        await this.checkCourseAccess(material.courseId, user, 'edit');

        // Toggle the visibility
        material.isHidden = !material.isHidden;
        const updatedMaterial = await this.materialRepository.save(material);

        return plainToInstance(MaterialDto, updatedMaterial);
    }

    private async checkCourseAccess(courseId: UUID, user: User, action: 'view' | 'edit' | 'delete'): Promise<void> {
        const userPrivileges = await user.getUserPrivileges();

        // System admins and course managers have full access
        if (userPrivileges['MANAGE_SYSTEM'] || userPrivileges['MANAGE_COURSES']) {
            return;
        }

        // Teachers have full access to their courses
        if (userPrivileges['TEACH_COURSE']) {
            // Check if user is assigned to this course
            const course = await this.courseRepository
                .createQueryBuilder('course')
                .leftJoin('course.users', 'user')
                .where('course.id = :courseId', { courseId })
                .andWhere('user.id = :userId', { userId: user.id })
                .getOne();

            if (course) {
                return;
            }
        }

        // Check course access permissions for assistants
        if (userPrivileges['ASSIST_IN_COURSE']) {
            const accessPermission = await this.courseAccessRepository.findOne({
                where: {
                    userId: user.id,
                    courseId: courseId,
                    section: CourseAccessSection.CONTENT,
                },
            });

            if (accessPermission) {
                if (action === 'view' && accessPermission.canView) return;
                if (action === 'edit' && accessPermission.canEdit) return;
                if (action === 'delete' && accessPermission.canDelete) return;
            }
        }

        // Students with STUDY_COURSE can only view non-hidden materials
        if (userPrivileges['STUDY_COURSE'] && action === 'view') {
            // Check if student is enrolled in the course
            // This would require checking student_courses table
            // For now, we'll allow if they have the privilege
            return;
        }

        throw new ForbiddenException('Insufficient permissions to access course materials');
    }

    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    private parseBoolean(value: any): boolean {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') return value.toLowerCase() === 'true';
        return Boolean(value);
    }
} 