import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { Entity } from './imports';
import { IsDate, IsNumber, IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateLabSessionDto {
	@ApiProperty()
	@IsString()
	@Expose()
	courseId: UUID;

	@ApiProperty()
	@IsNumber()
	@Expose()
	groupNumber: number;

	@ApiProperty()
	@IsDate()
	@Expose()
	date: Date;
}

export class UpdateLabSessionDto extends PartialType(CreateLabSessionDto) {}

export class LabSessionDto extends OmitType(CreateLabSessionDto, []) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class LabSessionListDto extends OmitType(LabSessionDto, []) {}

export class LabSessionPagedDto implements IPaginationOutput<LabSessionDto> {
	@ApiProperty({ type: () => LabSessionDto })
	@Expose()
	items: LabSessionDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class LabSessionPaginationInput extends IntersectionType(PaginationInput, Entity) {}

// NEW: Session Management DTOs

export class StartLabSessionDto {
	@ApiProperty({ description: 'Course Group ID for which to start the session' })
	@IsUUID()
	@Expose()
	courseGroupId: UUID;

	@ApiProperty({ description: 'Session date and time' })
	@IsDate()
	@Expose()
	sessionDateTime: Date;
}

export class SessionDeviceStatusDto {
	@ApiProperty({ description: 'Device ID' })
	@Expose()
	deviceId: UUID;

	@ApiProperty({ description: 'Device name' })
	@Expose()
	deviceName: string;

	@ApiProperty({ description: 'Whether device is currently active/functional' })
	@Expose()
	isActive: boolean;

	@ApiProperty({ description: 'Student currently using the device (if any)' })
	@Expose()
	currentUser?: {
		studentId: UUID;
		studentName: string;
		username: string;
	};

	@ApiProperty({ description: 'Login time for current user' })
	@Expose()
	loginTime?: Date;
}

export class SessionStudentDto {
	@ApiProperty({ description: 'Student ID' })
	@Expose()
	studentId: UUID;

	@ApiProperty({ description: 'Student name' })
	@Expose()
	studentName: string;

	@ApiProperty({ description: 'Student username' })
	@Expose()
	username: string;

	@ApiProperty({ description: 'Student email' })
	@Expose()
	email: string;

	@ApiProperty({ description: 'Whether student is currently present' })
	@Expose()
	isPresent: boolean;

	@ApiProperty({ description: 'Device assigned to student (if any)' })
	@Expose()
	assignedDevice?: {
		deviceId: UUID;
		deviceName: string;
	};

	@ApiProperty({ description: 'Session attendance points' })
	@Expose()
	attendancePoints: number;

	@ApiProperty({ description: 'Extra points awarded' })
	@Expose()
	extraPoints: number;
}

export class ActiveSessionDetailsDto {
	@ApiProperty({ description: 'Session ID' })
	@Expose()
	sessionId: UUID;

	@ApiProperty({ description: 'Course information' })
	@Expose()
	course: {
		id: UUID;
		name: string;
		code: string;
	};

	@ApiProperty({ description: 'Group information' })
	@Expose()
	group: {
		id: UUID;
		name: string;
		order: number;
	};

	@ApiProperty({ description: 'Lab information' })
	@Expose()
	lab: {
		id: UUID;
		name: string;
	};

	@ApiProperty({ description: 'Session start time' })
	@Expose()
	startTime: Date;

	@ApiProperty({ description: 'Expected duration in minutes' })
	@Expose()
	expectedDuration: number;

	@ApiProperty({ description: 'Device status list', type: [SessionDeviceStatusDto] })
	@Expose()
	devices: SessionDeviceStatusDto[];

	@ApiProperty({ description: 'Student list', type: [SessionStudentDto] })
	@Expose()
	students: SessionStudentDto[];
}

export class TakeAttendanceDto {
	@ApiProperty({ description: 'Student ID' })
	@IsUUID()
	@Expose()
	studentId: UUID;

	@ApiProperty({ description: 'Whether marking as present (true) or absent (false)' })
	@IsBoolean()
	@Expose()
	isPresent: boolean;

	@ApiProperty({ description: 'Points to deduct for absence (negative value)', required: false })
	@IsOptional()
	@IsNumber()
	@Expose()
	absencePoints?: number;
}

export class AddStudentToSessionDto {
	@ApiProperty({ description: 'Student ID to add to session' })
	@IsUUID()
	@Expose()
	studentId: UUID;

	@ApiProperty({ description: 'Mark as present when adding', required: false })
	@IsOptional()
	@IsBoolean()
	@Expose()
	markAsPresent?: boolean;
}

export class AwardExtraPointsDto {
	@ApiProperty({ description: 'Student ID' })
	@IsUUID()
	@Expose()
	studentId: UUID;

	@ApiProperty({ description: 'Extra points to award' })
	@IsNumber()
	@Expose()
	extraPoints: number;

	@ApiProperty({ description: 'Reason for awarding points', required: false })
	@IsOptional()
	@IsString()
	@Expose()
	reason?: string;
}
