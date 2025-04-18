import { BadRequestException, Injectable } from '@nestjs/common';
import { CourseDto, CourseListDto, CreateCourseDto, UpdateCourseDto } from './dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import { Course } from 'src/database/courses/course.entity';

@Injectable()
export class CourseService extends BaseService<Course, CreateCourseDto, UpdateCourseDto, CourseDto, CourseListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(Course) private readonly courseRepository: Repository<Course>,
	) {
		super(Course, CreateCourseDto, UpdateCourseDto, CourseDto, CourseListDto, courseRepository);
	}

}
