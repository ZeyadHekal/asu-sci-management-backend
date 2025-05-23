import { Injectable } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import { StudentCourses } from 'src/database/students/student_courses.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { User } from 'src/database/users/user.entity';
import { transformToInstance } from 'src/base/transformToInstance';

@Injectable()
export class CourseService extends BaseService<imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
		@InjectRepository(StudentCourses) private readonly studentCoursesRepository: Repository<StudentCourses>,
		@InjectRepository(CourseGroup) private readonly courseGroupRepository: Repository<CourseGroup>,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
	) {
		super(imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto, repository);
	}

	async getPaginated(input: imports.PaginationInput): Promise<imports.IPaginationOutput<imports.GetDto | imports.GetListDto>> {
		const { page, limit, sortBy, sortOrder } = input;
		const skip = page * limit;

		const query = this.repository.createQueryBuilder('course').leftJoinAndSelect('course.users', 'doctors').skip(skip).take(limit);

		// Add filtering based on input
		if ('courseType' in input && input.courseType) {
			const hasLab = input.courseType === 'Practical';
			query.andWhere('course.hasLab = :hasLab', { hasLab });
		}

		if ('subjectCode' in input && input.subjectCode) {
			query.andWhere('course.subjectCode = :subjectCode', { subjectCode: input.subjectCode });
		}

		if ('search' in input && input.search) {
			query.andWhere('(course.name LIKE :search OR CONCAT(course.subjectCode, course.courseNumber) LIKE :search)', { search: `%${input.search}%` });
		}

		// Apply sorting
		if (sortBy && sortOrder) {
			query.orderBy(`course.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
		} else {
			query.orderBy('course.subjectCode', 'ASC').addOrderBy('course.courseNumber', 'ASC');
		}

		const [courses, total] = await query.getManyAndCount();

		// Transform courses to include additional data
		const items = await Promise.all(
			courses.map(async (course) => {
				// Get assigned doctors
				const doctors = await course.users;
				const assignedDoctors = doctors.map((doctor) => doctor.name);

				// Count enrolled students
				const numberOfStudents = await this.studentCoursesRepository.count({
					where: { courseId: course.id },
				});

				// Check if course has default group
				const hasDefaultGroup = await this.courseGroupRepository.exists({
					where: { courseId: course.id, isDefault: true },
				});

				return transformToInstance(imports.GetListDto, {
					...course,
					courseCode: `${course.subjectCode}${course.courseNumber}`,
					courseType: course.hasLab ? 'Practical' : 'Theory',
					assignedDoctors,
					numberOfStudents,
					hasDefaultGroup,
				});
			}),
		);

		return { items, total };
	}

	async getCourseStatistics() {
		const totalCourses = await this.repository.count();
		const practicalCourses = await this.repository.count({ where: { hasLab: true } });
		const theoryCourses = totalCourses - practicalCourses;

		const coursesWithDefaultGroups = await this.repository
			.createQueryBuilder('course')
			.innerJoin('course_groups', 'cg', 'cg.course_id = course.id AND cg.is_default = true')
			.where('course.hasLab = true')
			.getCount();

		const totalStudents = await this.studentCoursesRepository.count();

		return {
			totalCourses,
			practicalCourses,
			theoryCourses,
			coursesWithDefaultGroups,
			practicalCoursesWithoutDefaultGroups: practicalCourses - coursesWithDefaultGroups,
			totalStudents,
		};
	}
}
