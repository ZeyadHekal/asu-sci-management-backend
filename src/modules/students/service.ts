import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateStudentDto, StudentDto, StudentListDto, UpdateStudentDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import { Student } from 'src/database/students/student.entity';

@Injectable()
export class StudentService extends BaseService<Student, CreateStudentDto, UpdateStudentDto, StudentDto, StudentListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(Student) private readonly studentRepository: Repository<Student>,
	) {
		super(Student, CreateStudentDto, UpdateStudentDto, StudentDto, StudentListDto, studentRepository);
	}

}
