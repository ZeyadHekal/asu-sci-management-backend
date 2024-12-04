import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsJWT, IsString, IsStrongPassword } from 'class-validator';

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

export class LoginSuccessDto extends AuthJwtDto {
	// TODO: PrivilegeListDto[]
	@ApiProperty()
	@Expose()
	privileges: string;
}

export class LoginRequestDto {
	@ApiProperty()
	@IsString()
	@Expose()
	username: string;
	@ApiProperty({ example: 'Abcd@1234' })
	@IsStrongPassword({}, { message: 'Password must be at least of length 8 and includes numbers, lower and upper case letters and symbols.' })
	@Expose()
	password: string;
}
