import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import * as imports from './imports';
import { EnrollStudentDto } from './dtos';

@Controller(imports.constants.plural_name)
@imports.ApiTags(imports.constants.plural_name)
export class StudentCourseController {
	constructor(private readonly service: imports.Service) {}

	@Post('enroll')
	@imports.ApiOperation({ summary: `Enroll a student in a course with automatic group assignment` })
	@imports.ApiResponse({ status: 201, description: 'Student enrolled successfully.', type: imports.GetDto })
	@imports.ApiResponse({ status: 400, description: 'Bad Request.' })
	async enrollStudent(@Body() enrollDto: EnrollStudentDto): Promise<imports.GetDto> {
		return this.service.enrollStudent(enrollDto);
	}

	@Get()
	@imports.ApiOperation({ summary: `Get all ${imports.constants.plural_name}` })
	@imports.ApiResponse({ status: 200, description: 'Return all enrollments.', type: imports.PagedDto })
	async getPaginated(@Query() input: imports.PaginationInput): Promise<imports.IPaginationOutput<imports.GetListDto>> {
		return this.service.getPaginated(input);
	}
}
