import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsString, IsBoolean, IsUUID, IsOptional, IsDateString } from 'class-validator';
import { UUID } from 'crypto';

export class CreateMaterialDto {
    @ApiProperty({ description: 'Material name' })
    @IsString()
    @Expose()
    name: string;

    @ApiPropertyOptional({ description: 'Material description' })
    @IsString()
    @IsOptional()
    @Expose()
    description?: string;

    @ApiPropertyOptional({ description: 'Whether material is hidden from students', default: false })
    @IsBoolean()
    @IsOptional()
    @Expose()
    isHidden?: boolean;

    @ApiPropertyOptional({
        description: 'Files to upload',
        type: 'array',
        items: {
            type: 'string',
            format: 'binary'
        }
    })
    @IsOptional()
    @Expose()
    files?: any[];
}

export class UpdateMaterialDto {
    @ApiPropertyOptional({ description: 'Material name' })
    @IsString()
    @IsOptional()
    @Expose()
    name?: string;

    @ApiPropertyOptional({ description: 'Material description' })
    @IsString()
    @IsOptional()
    @Expose()
    description?: string;

    @ApiPropertyOptional({ description: 'Whether material is hidden from students' })
    @IsBoolean()
    @IsOptional()
    @Expose()
    isHidden?: boolean;
}

export class MaterialDto {
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
    description: string;

    @ApiProperty()
    @IsString()
    @Expose()
    attachments: string;

    @ApiProperty()
    @IsBoolean()
    @Expose()
    isHidden: boolean;

    @ApiProperty()
    @IsUUID()
    @Expose()
    courseId: UUID;

    @ApiProperty()
    @IsDateString()
    @Expose()
    created_at: Date;

    @ApiProperty()
    @IsDateString()
    @Expose()
    updated_at: Date;
}

export class MaterialListDto {
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
    description: string;

    @ApiProperty()
    @IsString()
    @Expose()
    attachments: string;

    @ApiProperty()
    @IsBoolean()
    @Expose()
    isHidden: boolean;

    @ApiProperty()
    @IsUUID()
    @Expose()
    courseId: UUID;

    @ApiProperty()
    @IsDateString()
    @Expose()
    created_at: Date;

    @ApiProperty()
    @IsDateString()
    @Expose()
    updated_at: Date;

    @ApiProperty()
    @IsString()
    @Expose()
    uploadedBy: string;

    @ApiProperty()
    @IsString()
    @Expose()
    fileSize: string;

    @ApiProperty({ type: [String] })
    @Expose()
    fileUrls: string[];
} 