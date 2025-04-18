import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsString, IsStrongPassword, IsUUID, MinLength } from 'class-validator';
import { UUID } from 'crypto';

export class CreateLabDto {
	@ApiProperty()
	@IsString()
	@Expose()
	name: string;
}

export class UpdateLabDto extends PartialType(CreateLabDto) {}

export class LabDto extends OmitType(CreateLabDto,[]) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class LabListDto extends OmitType(LabDto, []) {}
