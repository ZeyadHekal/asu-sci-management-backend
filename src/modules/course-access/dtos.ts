import { UUID } from 'crypto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { CourseAccessSection } from 'src/database/courses/course-access.entity';

export class CourseAccessPermissionDto {
    @ApiProperty()
    @IsUUID()
    @Expose()
    userId: UUID;

    @ApiProperty()
    @IsUUID()
    @Expose()
    courseId: UUID;

    @ApiProperty({ enum: CourseAccessSection })
    @IsEnum(CourseAccessSection)
    @Expose()
    section: CourseAccessSection;

    @ApiProperty({ default: false })
    @IsBoolean()
    @Expose()
    canView: boolean;

    @ApiProperty({ default: false })
    @IsBoolean()
    @Expose()
    canEdit: boolean;

    @ApiProperty({ default: false })
    @IsBoolean()
    @Expose()
    canDelete: boolean;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    @Expose()
    grantedBy?: UUID;

    @ApiProperty()
    @Expose()
    created_at: Date;

    @ApiProperty()
    @Expose()
    updated_at: Date;
}

export class UserCourseAccessDto {
    @ApiProperty()
    @IsUUID()
    @Expose()
    userId: UUID;

    @ApiProperty()
    @IsString()
    @Expose()
    userName: string;

    @ApiProperty()
    @IsString()
    @Expose()
    userEmail: string;

    @ApiProperty({ type: [CourseAccessPermissionDto] })
    @Type(() => CourseAccessPermissionDto)
    @IsArray()
    @Expose()
    permissions: CourseAccessPermissionDto[];
}

export class CreateCourseAccessDto {
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    @Expose()
    userId: UUID;

    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    @Expose()
    courseId: UUID;

    @ApiProperty({ enum: CourseAccessSection })
    @IsEnum(CourseAccessSection)
    @Expose()
    section: CourseAccessSection;

    @ApiProperty({ default: false })
    @IsBoolean()
    @Expose()
    canView: boolean;

    @ApiProperty({ default: false })
    @IsBoolean()
    @Expose()
    canEdit: boolean;

    @ApiProperty({ default: false })
    @IsBoolean()
    @Expose()
    canDelete: boolean;
}

export class UpdateCourseAccessDto {
    @ApiProperty({ default: false })
    @IsBoolean()
    @Expose()
    canView: boolean;

    @ApiProperty({ default: false })
    @IsBoolean()
    @Expose()
    canEdit: boolean;

    @ApiProperty({ default: false })
    @IsBoolean()
    @Expose()
    canDelete: boolean;
}

export class BulkUpdateCourseAccessDto {
    @ApiProperty({ type: [CreateCourseAccessDto] })
    @Type(() => CreateCourseAccessDto)
    @IsArray()
    @Expose()
    permissions: CreateCourseAccessDto[];
}

export class CourseAccessSummaryDto {
    @ApiProperty()
    @IsUUID()
    @Expose()
    courseId: UUID;

    @ApiProperty()
    @IsString()
    @Expose()
    courseName: string;

    @ApiProperty()
    @IsString()
    @Expose()
    courseCode: string;

    @ApiProperty({ type: [UserCourseAccessDto] })
    @Type(() => UserCourseAccessDto)
    @IsArray()
    @Expose()
    userAccess: UserCourseAccessDto[];
}

export class AssistantListDto {
    @ApiProperty()
    @IsUUID()
    @Expose()
    id: UUID;

    @ApiProperty()
    @IsString()
    @Expose()
    name: string;

    @ApiProperty()
    @IsString()
    @Expose()
    email: string;

    @ApiProperty()
    @IsString()
    @Expose()
    username: string;

    @ApiProperty({ default: false })
    @IsBoolean()
    @Expose()
    hasAccess: boolean;

    @ApiProperty({ type: [CourseAccessPermissionDto] })
    @Type(() => CourseAccessPermissionDto)
    @IsArray()
    @Expose()
    permissions: CourseAccessPermissionDto[];
}

export class GrantMultipleSectionsDto {
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    @Expose()
    userId: UUID;

    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    @Expose()
    courseId: UUID;

    @ApiProperty({ type: [CreateCourseAccessDto] })
    @Type(() => CreateCourseAccessDto)
    @IsArray()
    @Expose()
    sections: Omit<CreateCourseAccessDto, 'userId' | 'courseId'>[];
} 