import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CourseService } from './service';
import { CourseDto, CourseListDto, CreateCourseDto, UpdateCourseDto } from './dtos';
import { BaseController } from 'src/base/base.controller';
import { UUID } from 'crypto';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { DeleteDto } from 'src/base/delete.dto';
import { Course } from 'src/database/courses/course.entity';

@Controller('courses')
export class CourseController extends BaseController<Course, CreateCourseDto, UpdateCourseDto, CourseDto, CourseListDto> {
	constructor(private readonly courseService: CourseService) {
		super(courseService, Course, CreateCourseDto, UpdateCourseDto, CourseDto, CourseListDto);
	}

	@Post()
	@ApiCreatedResponse({ type: CourseDto })
	create(@Body() createDto: CreateCourseDto): Promise<CourseDto> {
		return super.create(createDto);
	}

	@Get()
	@ApiOkResponse({ type: CourseListDto })
	getAll(): Promise<CourseListDto[]> {
		return super.getAll();
	}

	// TODO: Implement
	@Get('paginated')
	@ApiOkResponse({ type: CourseDto })
	getPaginated(): Promise<CourseDto[]> {
		return;
	}

	@Get(':course_id')
	@ApiOkResponse({ type: CourseDto })
	getById(@Param(':course_id') id: UUID): Promise<CourseDto> {
		return super.getById(id);
	}

	@Patch(':course_id')
	@ApiOkResponse({ type: CourseDto })
	update(@Param('course_id') id: UUID, @Body() updateDto: UpdateCourseDto): Promise<CourseDto> {
		return super.update(id, updateDto);
	}

	// TODO: Fix return type
	@Delete(':course_ids')
	@ApiOkResponse({ type: DeleteDto })
	delete(@Param('course_ids') ids: string): Promise<any> {
		return super.delete(ids);
	}
}
