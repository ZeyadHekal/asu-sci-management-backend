import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StudentService } from './service';
import {  CreateStudentDto, StudentDto, StudentListDto, UpdateStudentDto } from './dtos';
import { BaseController } from 'src/base/base.controller';
import { UUID } from 'crypto';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { DeleteDto } from 'src/base/delete.dto';
import { Student } from 'src/database/students/student.entity';

@Controller('students')
export class StudentController extends BaseController<Student, CreateStudentDto, UpdateStudentDto, StudentDto, StudentListDto> {
	constructor(private readonly studentService: StudentService) {
		super(studentService, Student, CreateStudentDto, UpdateStudentDto, StudentDto, StudentListDto);
	}

	@Post()
	@ApiCreatedResponse({ type: StudentDto })
	create(@Body() createDto: CreateStudentDto): Promise<StudentDto> {
		return super.create(createDto);
	}

	@Get()
	@ApiOkResponse({ type: StudentListDto })
	getAll(): Promise<StudentListDto[]> {
		return super.getAll();
	}

	// TODO: Implement
	@Get('paginated')
	@ApiOkResponse({ type: StudentDto })
	getPaginated(): Promise<StudentDto[]> {
		return;
	}

	@Get(':student_id')
	@ApiOkResponse({ type: StudentDto })
	getById(@Param(':student_id') id: UUID): Promise<StudentDto> {
		return super.getById(id);
	}

	@Patch(':student_id')
	@ApiOkResponse({ type: StudentDto })
	update(@Param('student_id') id: UUID, @Body() updateDto: UpdateStudentDto): Promise<StudentDto> {
		return super.update(id, updateDto);
	}

	// TODO: Fix return type
	@Delete(':student_ids')
	@ApiOkResponse({ type: DeleteDto })
	delete(@Param('student_ids') ids: string): Promise<any> {
		return super.delete(ids);
	}
}
