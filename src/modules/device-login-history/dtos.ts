import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { LoginStatus } from 'src/database/devices/device-login-history.entity';

export class CreateLoginHistoryDto {
    @ApiProperty({ description: 'Device ID' })
    @IsUUID()
    @Expose()
    deviceId: UUID;

    @ApiProperty({ description: 'User ID' })
    @IsUUID()
    @Expose()
    userId: UUID;

    @ApiProperty({ description: 'IP Address' })
    @IsString()
    @Expose()
    ipAddress: string;

    @ApiProperty({ enum: LoginStatus, description: 'Login status' })
    @IsEnum(LoginStatus)
    @Expose()
    loginStatus: LoginStatus;

    @ApiProperty({ description: 'Login time' })
    @IsDateString()
    @Expose()
    loginTime: Date;

    @ApiProperty({ description: 'Logout time', required: false })
    @IsOptional()
    @IsDateString()
    @Expose()
    logoutTime?: Date;

    @ApiProperty({ description: 'Session duration in minutes', required: false })
    @IsOptional()
    @IsNumber()
    @Expose()
    sessionDuration?: number;

    @ApiProperty({ description: 'User agent', required: false })
    @IsOptional()
    @IsString()
    @Expose()
    userAgent?: string;

    @ApiProperty({ description: 'Operating system', required: false })
    @IsOptional()
    @IsString()
    @Expose()
    operatingSystem?: string;

    @ApiProperty({ description: 'Browser', required: false })
    @IsOptional()
    @IsString()
    @Expose()
    browser?: string;

    @ApiProperty({ description: 'Failure reason', required: false })
    @IsOptional()
    @IsString()
    @Expose()
    failureReason?: string;
}

export class UpdateLoginHistoryDto extends PartialType(CreateLoginHistoryDto) { }

export class LoginHistoryDto extends CreateLoginHistoryDto {
    @ApiProperty({ description: 'Login history ID' })
    @Expose()
    id: UUID;

    @ApiProperty({ description: 'Created at' })
    @Expose()
    created_at: Date;

    @ApiProperty({ description: 'Updated at' })
    @Expose()
    updated_at: Date;

    @ApiProperty({ description: 'Device name', required: false })
    @Expose()
    deviceName?: string;

    @ApiProperty({ description: 'User name', required: false })
    @Expose()
    userName?: string;
}

export class LoginHistoryListDto extends OmitType(LoginHistoryDto, []) { }

export class LoginHistoryPagedDto implements IPaginationOutput<LoginHistoryListDto> {
    @ApiProperty({ type: [LoginHistoryListDto] })
    @Expose()
    items: LoginHistoryListDto[];

    @ApiProperty()
    @Expose()
    total: number;
}

export class LoginHistoryPaginationInput extends PaginationInput {
    @ApiProperty({ required: false, description: 'Filter by device ID' })
    @IsOptional()
    @IsUUID()
    @Expose()
    deviceId?: UUID;

    @ApiProperty({ required: false, description: 'Filter by user ID' })
    @IsOptional()
    @IsUUID()
    @Expose()
    userId?: UUID;

    @ApiProperty({ required: false, description: 'Filter by IP address' })
    @IsOptional()
    @IsString()
    @Expose()
    ipAddress?: string;

    @ApiProperty({ enum: LoginStatus, required: false, description: 'Filter by login status' })
    @IsOptional()
    @IsEnum(LoginStatus)
    @Expose()
    loginStatus?: LoginStatus;
} 