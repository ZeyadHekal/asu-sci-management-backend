import { PartialType } from '@nestjs/swagger';

export class CreateDefaultDto {}

export class UpdateDefaultDto extends PartialType(CreateDefaultDto) {}
