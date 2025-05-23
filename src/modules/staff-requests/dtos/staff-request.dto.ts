import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, MinLength } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { UUID } from 'crypto';
import { StaffRequestStatus } from 'src/database/staff-requests/staff-request.entity';

export class CreateStaffRequestDto {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;

	@ApiProperty()
	@IsString()
	@Expose()
	username: string;

	@ApiProperty()
	@IsString()
	@Expose()
	title: string;

	@ApiProperty()
	@IsString()
	@Expose()
	department: string;

	@ApiProperty({ example: 'Abcd@1234' })
	@IsString()
	@MinLength(8)
	@Expose()
	password: string;

	@ApiProperty({ example: 'Abcd@1234' })
	@IsString()
	@MinLength(8)
	@Expose()
	confirmPassword: string;

	@ApiProperty({ type: 'string', format: 'binary', description: 'ID photo (PNG, JPG, JPEG up to 10MB)' })
	@IsOptional()
	@Expose()
	idPhoto?: any;
}

export class ApproveStaffRequestDto {
	@ApiProperty({ description: 'Name of the staff member' })
	@IsString()
	@Expose()
	name: string;

	@ApiProperty({ description: 'Username for the staff member' })
	@IsString()
	@Expose()
	username: string;

	@ApiProperty({ description: 'Title/Position of the staff member' })
	@IsString()
	@Expose()
	title: string;

	@ApiProperty({ description: 'Department of the staff member' })
	@IsString()
	@Expose()
	department: string;

	@ApiProperty({ description: 'User type ID to assign to the approved staff member' })
	@IsUUID()
	@Expose()
	userTypeId: UUID;
}

export class RejectStaffRequestDto {
	@ApiProperty({ description: 'Reason for rejecting the staff request' })
	@IsString()
	@Expose()
	reason: string;
}

export class UpdateStaffRequestDto extends PartialType(CreateStaffRequestDto) {
	@ApiProperty({ enum: StaffRequestStatus })
	@IsEnum(StaffRequestStatus)
	@IsOptional()
	@Expose()
	status?: StaffRequestStatus;

	@ApiProperty()
	@IsString()
	@IsOptional()
	@Expose()
	rejectionReason?: string;

	@ApiProperty()
	@IsUUID()
	@IsOptional()
	@Expose()
	userTypeId?: UUID;
}

export class StaffRequestDto extends OmitType(CreateStaffRequestDto, ['password', 'confirmPassword', 'idPhoto']) {
	@ApiProperty()
	@Expose()
	id: UUID;

	@ApiProperty({ enum: StaffRequestStatus })
	@Expose()
	status: StaffRequestStatus;

	@ApiProperty()
	@IsString()
	@IsOptional()
	@Expose()
	rejectionReason?: string;

	@ApiProperty()
	@IsUUID()
	@IsOptional()
	@Expose()
	approvedById?: UUID;

	@ApiProperty()
	@IsOptional()
	@Expose()
	approvedAt?: Date;

	@ApiProperty()
	@Expose()
	@Transform(({ obj }) => obj.created_at)
	createdAt: Date;

	@ApiProperty()
	@Expose()
	@Transform(({ obj }) => obj.updated_at)
	updatedAt: Date;

	@IsString()
	@IsOptional()
	@Expose()
	idPhoto?: string;

	@ApiProperty({ description: 'Presigned URL for accessing the ID photo', required: false })
	@IsString()
	@IsOptional()
	@Expose()
	idPhotoUrl?: string;

	@ApiProperty()
	@IsUUID()
	@IsOptional()
	@Expose()
	userTypeId?: UUID;
}

export class StaffRequestPagedDto {
	@ApiProperty({ type: [StaffRequestDto] })
	@Expose()
	items: StaffRequestDto[];

	@ApiProperty()
	@Expose()
	total: number;
}
