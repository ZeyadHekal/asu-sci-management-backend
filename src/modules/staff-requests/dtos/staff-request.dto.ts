import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsString, IsEmail, IsUUID, IsOptional, IsEnum, IsStrongPassword } from 'class-validator';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { StaffRequestStatus } from 'src/database/staff-requests/staff-request.entity';

export class CreateStaffRequestDto {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;

	@ApiProperty()
	@IsEmail()
	@Expose()
	email: string;

	@ApiProperty()
	@IsString()
	@Expose()
	title: string;

	@ApiProperty()
	@IsString()
	@Expose()
	department: string;

	@ApiProperty({ example: 'Abcd@1234' })
	@IsStrongPassword({}, { message: 'Password must be at least of length 8 and includes numbers, lower and upper case letters and symbols.' })
	@Expose()
	password: string;

	@ApiProperty({ example: 'Abcd@1234' })
	@IsString()
	@Expose()
	confirmPassword: string;

	@ApiProperty({ type: 'string', format: 'binary', description: 'ID photo (PNG, JPG, JPEG up to 10MB)' })
	idPhoto: Express.Multer.File;
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
	createdAt: Date;

	@ApiProperty()
	@Expose()
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
