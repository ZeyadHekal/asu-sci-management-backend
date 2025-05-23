import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsJWT, IsString, IsStrongPassword, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class RefreshRequsetDto {
	@ApiProperty()
	@IsJWT()
	@Expose()
	refreshToken: string;
}

export class AuthJwtDto extends RefreshRequsetDto {
	@ApiProperty()
	@IsJWT()
	@Expose()
	accessToken: string;
}

export class PrivilegRefreshDto {
	@ApiProperty()
	@Expose()
	privileges: string[];
}

export class UserInfoDto {
	@ApiProperty()
	@Expose()
	@IsUUID()
	id: UUID;

	@ApiProperty()
	@Expose()
	name: string;

	@ApiProperty()
	@Expose()
	username: string;

	@ApiProperty()
	@Expose()
	userType: string;

	@ApiProperty()
	@Expose()
	isStudent: boolean;

	@ApiProperty({ required: false, description: 'Exam mode status for students' })
	@Expose()
	examModeStatus?: {
		isInExamMode: boolean;
		examStartsIn?: number;
		examSchedules: {
			eventScheduleId: UUID;
			eventName: string;
			dateTime: Date;
			status: string;
		}[];
	};
}

export class LoginSuccessDto extends IntersectionType(AuthJwtDto, PrivilegRefreshDto) {
	@ApiProperty()
	@Expose()
	user: UserInfoDto;
}

export class LoginRequestDto {
	@ApiProperty({ example: 'admin' })
	@IsString()
	@Expose()
	username: string;
	@ApiProperty({ example: 'Abcd@1234' })
	@IsStrongPassword({}, { message: 'Password must be at least of length 8 and includes numbers, lower and upper case letters and symbols.' })
	@Expose()
	password: string;
}
