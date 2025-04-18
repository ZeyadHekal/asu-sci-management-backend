import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UUID } from 'crypto';
import { IPaginationOutput } from 'src/base/interfaces/interface.pagination.output';
import { PaginationInput } from 'src/base/pagination.input';
import { Entity } from './imports';

export class CreateTemplateDto {
	attributes: string;
}

export class UpdateTemplateDto extends PartialType(CreateTemplateDto) { }

export class TemplateDto extends OmitType(CreateTemplateDto, []) {
	@ApiProperty()
	@Expose()
	id: UUID;
}

export class TemplateListDto extends OmitType(TemplateDto, []) { }

export class TemplatePagedDto implements IPaginationOutput<TemplateDto> {
	@ApiProperty({ type: () => TemplateDto })
	@Expose()
	items: TemplateDto[];

	@ApiProperty()
	@Expose()
	total: number;
}

export class TemplatePaginationInput extends IntersectionType(PaginationInput, Entity) { }