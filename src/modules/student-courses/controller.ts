import { Body, Controller, Get, Post, Query, Param, Delete, Put } from '@nestjs/common';
import * as imports from './imports';
import { EnrollStudentDto, UpdateEnrollmentDto } from './dtos';

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

	@Get('student/:studentId')
	@imports.ApiOperation({ summary: `Get all courses enrolled by a specific student` })
	@imports.ApiResponse({ status: 200, description: 'Return student enrolled courses.', type: [imports.GetListDto] })
	@imports.ApiResponse({ status: 404, description: 'Student not found.' })
	async getStudentCourses(@Param('studentId') studentId: imports.UUID): Promise<imports.GetListDto[]> {
		return this.service.getStudentCourses(studentId);
	}

	@Put(':studentId/:courseId')
	@imports.ApiOperation({ summary: `Update student enrollment details` })
	@imports.ApiResponse({ status: 200, description: 'Enrollment updated successfully.', type: imports.GetDto })
	@imports.ApiResponse({ status: 404, description: 'Enrollment not found.' })
	async updateEnrollment(
		@Param('studentId') studentId: imports.UUID,
		@Param('courseId') courseId: imports.UUID,
		@Body() updateDto: UpdateEnrollmentDto,
	): Promise<imports.GetDto> {
		return this.service.updateEnrollment(studentId, courseId, updateDto);
	}

	@Delete(':studentId/:courseId')
	@imports.ApiOperation({ summary: `Remove student from a course` })
	@imports.ApiResponse({ status: 200, description: 'Student successfully removed from course.' })
	@imports.ApiResponse({ status: 404, description: 'Enrollment not found.' })
	async removeStudentFromCourse(
		@Param('studentId') studentId: imports.UUID,
		@Param('courseId') courseId: imports.UUID,
	): Promise<{ message: string }> {
		return this.service.removeStudentFromCourse(studentId, courseId);
	}

	@Get('available-courses')
	@imports.ApiOperation({ summary: `Get available courses for enrollment` })
	@imports.ApiResponse({ status: 200, description: 'Return available courses.', type: Array })
	async getAvailableCourses(): Promise<{ id: imports.UUID; code: string; name: string; credits: number }[]> {
		return this.service.getAvailableCourses();
	}
}
