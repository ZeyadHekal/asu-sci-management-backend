import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { UUID } from 'crypto';

export class CreateUserTypeDto {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;
}

export class UpdateUserTypeDto extends PartialType(CreateUserTypeDto) {}

export class UserTypeDto extends CreateUserTypeDto {
	@ApiProperty()
	@Expose()
	id: UUID;
}
