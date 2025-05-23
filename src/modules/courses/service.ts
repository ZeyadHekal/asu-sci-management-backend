import { Injectable } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import { StudentCourses } from 'src/database/students/student_courses.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { User } from 'src/database/users/user.entity';
import { Software } from 'src/database/softwares/software.entity';
import { transformToInstance } from 'src/base/transformToInstance';
import { UUID } from 'crypto';

@Injectable()
export class CourseService extends BaseService<imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
		@InjectRepository(StudentCourses) private readonly studentCoursesRepository: Repository<StudentCourses>,
		@InjectRepository(CourseGroup) private readonly courseGroupRepository: Repository<CourseGroup>,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		@InjectRepository(Software) private readonly softwareRepository: Repository<Software>,
	) {
		super(imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto, repository);
	}

	async create(createDto: imports.CreateDto): Promise<imports.GetDto> {
		const { doctorIds, softwareIds, ...courseData } = createDto;

		// Create the course first
		const course = this.repository.create(courseData);
		const savedCourse = await this.repository.save(course);

		// Handle doctor assignments
		if (doctorIds && doctorIds.length > 0) {
			const doctors = await this.userRepository.find({ where: { id: In(doctorIds) } });
			savedCourse.users = Promise.resolve(doctors);
			await this.repository.save(savedCourse);
		}

		// Handle software assignments
		if (softwareIds && softwareIds.length > 0) {
			const softwares = await this.softwareRepository.find({ where: { id: In(softwareIds) } });
			savedCourse.softwares = Promise.resolve(softwares);
			await this.repository.save(savedCourse);
		}

		// Create default group for practical courses
		if (savedCourse.hasLab) {
			await this.createDefaultGroup(savedCourse.id);
		}

		return this.getById(savedCourse.id);
	}

	private async createDefaultGroup(courseId: UUID): Promise<void> {
		// Check if default group already exists (race condition protection)
		const existingDefaultGroup = await this.courseGroupRepository.findOne({
			where: { courseId, isDefault: true },
		});

		if (existingDefaultGroup) {
			return; // Default group already exists
		}

		// Create default group with order 999 for lowest priority
		const defaultGroup = this.courseGroupRepository.create({
			courseId,
			order: 999,
			groupNumber: 999,
			isDefault: true,
			labId: null, // No lab assigned initially
			capacity: 0, // Will be calculated when lab is assigned
		});

		await this.courseGroupRepository.save(defaultGroup);
	}

	async update(id: UUID, updateDto: imports.UpdateDto): Promise<imports.GetDto> {
		const { doctorIds, softwareIds, ...courseData } = updateDto;

		// Update the course basic data
		await this.repository.update(id, courseData);
		const course = await this.repository.findOne({ where: { id } });

		if (!course) {
			throw new Error('Course not found');
		}

		// Handle doctor assignments if provided
		if (doctorIds !== undefined) {
			if (doctorIds.length > 0) {
				const doctors = await this.userRepository.find({ where: { id: In(doctorIds) } });
				course.users = Promise.resolve(doctors);
			} else {
				course.users = Promise.resolve([]);
			}
			await this.repository.save(course);
		}

		// Handle software assignments if provided
		if (softwareIds !== undefined) {
			if (softwareIds.length > 0) {
				const softwares = await this.softwareRepository.find({ where: { id: In(softwareIds) } });
				course.softwares = Promise.resolve(softwares);
			} else {
				course.softwares = Promise.resolve([]);
			}
			await this.repository.save(course);
		}

		return this.getById(id);
	}

	async getMyCourses(userId: UUID): Promise<imports.GetListDto[]> {
		// Get courses where the current user is one of the doctors
		const courses = await this.repository
			.createQueryBuilder('course')
			.innerJoin('course.users', 'doctors', 'doctors.id = :userId', { userId })
			.leftJoinAndSelect('course.users', 'allDoctors')
			.leftJoinAndSelect('course.softwares', 'software')
			.orderBy('course.subjectCode', 'ASC')
			.addOrderBy('course.courseNumber', 'ASC')
			.getMany();

		// Transform courses to include additional data
		const items = await Promise.all(
			courses.map(async (course) => {
				// Get assigned doctors
				const doctors = await course.users;
				const assignedDoctors = doctors.map((doctor) => doctor.name);

				// Get required software
				const softwares = await course.softwares;
				const requiredSoftware = softwares.map((software) => software.name);

				// Count enrolled students - ensure accurate count
				const numberOfStudents = await this.studentCoursesRepository.count({
					where: { courseId: course.id },
				});

				// Check if course has default group
				const hasDefaultGroup = await this.courseGroupRepository.exists({
					where: { courseId: course.id, isDefault: true },
				});

				// Ensure proper course code formatting
				const courseCode = `${course.subjectCode}${course.courseNumber}`;

				// Ensure proper course type based on hasLab boolean
				const courseType = course.hasLab ? 'Practical' : 'Theory';

				return transformToInstance(imports.GetListDto, {
					...course,
					courseCode,
					courseType,
					assignedDoctors,
					requiredSoftware,
					numberOfStudents,
					hasDefaultGroup,
				});
			}),
		);

		return items;
	}

	async getPaginated(input: imports.PaginationInput): Promise<imports.IPaginationOutput<imports.GetDto | imports.GetListDto>> {
		const { page, limit, sortBy, sortOrder } = input;
		const skip = page * limit;

		const query = this.repository.createQueryBuilder('course')
			.leftJoinAndSelect('course.users', 'doctors')
			.leftJoinAndSelect('course.softwares', 'software')
			.skip(skip)
			.take(limit);

		// Cast input to the correct type to access extended properties
		const coursePaginationInput = input as imports.PaginationInput & { courseType?: 'Practical' | 'Theory'; subjectCode?: string; search?: string };

		// Add filtering based on input
		if (coursePaginationInput.courseType) {
			const hasLab = coursePaginationInput.courseType === 'Practical';
			query.andWhere('course.hasLab = :hasLab', { hasLab });
		}

		if (coursePaginationInput.subjectCode) {
			query.andWhere('course.subjectCode = :subjectCode', { subjectCode: coursePaginationInput.subjectCode });
		}

		if (coursePaginationInput.search) {
			const searchTerm = coursePaginationInput.search.toLowerCase().replace(/\s+/g, '');
			query.andWhere(
				'(LOWER(course.name) LIKE :search OR LOWER(CONCAT(course.subjectCode, course.courseNumber)) LIKE :search OR LOWER(CONCAT(course.subjectCode, \' \', course.courseNumber)) LIKE :searchWithSpace)',
				{
					search: `%${searchTerm}%`,
					searchWithSpace: `%${coursePaginationInput.search.toLowerCase()}%`
				}
			);
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

				// Get required software
				const softwares = await course.softwares;
				const requiredSoftware = softwares.map((software) => software.name);

				// Count enrolled students - ensure accurate count
				const numberOfStudents = await this.studentCoursesRepository.count({
					where: { courseId: course.id },
				});

				// Check if course has default group
				const hasDefaultGroup = await this.courseGroupRepository.exists({
					where: { courseId: course.id, isDefault: true },
				});

				// Ensure proper course code formatting
				const courseCode = `${course.subjectCode}${course.courseNumber}`;

				// Ensure proper course type based on hasLab boolean
				const courseType = course.hasLab ? 'Practical' : 'Theory';

				return transformToInstance(imports.GetListDto, {
					...course,
					courseCode,
					courseType,
					assignedDoctors,
					requiredSoftware,
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

	async validateCourseData(): Promise<{
		coursesWithIncorrectCodes: any[];
		coursesWithMissingStudentCounts: any[];
		coursesWithIncorrectTypes: any[];
		summary: {
			totalCourses: number;
			totalEnrollments: number;
			practicalCourses: number;
			theoryCourses: number;
		};
	}> {
		// Get all courses with basic data
		const allCourses = await this.repository.find();

		// Validate course codes and types
		const coursesWithIncorrectCodes = [];
		const coursesWithIncorrectTypes = [];
		const coursesWithMissingStudentCounts = [];

		for (const course of allCourses) {
			// Check course code format
			const expectedCode = `${course.subjectCode}${course.courseNumber}`;
			if (!expectedCode || expectedCode.length < 3) {
				coursesWithIncorrectCodes.push({
					id: course.id,
					name: course.name,
					subjectCode: course.subjectCode,
					courseNumber: course.courseNumber,
					generatedCode: expectedCode
				});
			}

			// Check course type consistency
			const expectedType = course.hasLab ? 'Practical' : 'Theory';
			if (typeof course.hasLab !== 'boolean') {
				coursesWithIncorrectTypes.push({
					id: course.id,
					name: course.name,
					hasLab: course.hasLab,
					expectedType
				});
			}

			// Check student count accuracy
			const studentCount = await this.studentCoursesRepository.count({
				where: { courseId: course.id }
			});

			if (studentCount < 0) {
				coursesWithMissingStudentCounts.push({
					id: course.id,
					name: course.name,
					studentCount
				});
			}
		}

		// Generate summary
		const totalEnrollments = await this.studentCoursesRepository.count();
		const practicalCourses = await this.repository.count({ where: { hasLab: true } });
		const theoryCourses = allCourses.length - practicalCourses;

		return {
			coursesWithIncorrectCodes,
			coursesWithMissingStudentCounts,
			coursesWithIncorrectTypes,
			summary: {
				totalCourses: allCourses.length,
				totalEnrollments,
				practicalCourses,
				theoryCourses
			}
		};
	}

	async getById(id: UUID): Promise<imports.GetDto> {
		const course = await this.repository
			.createQueryBuilder('course')
			.leftJoinAndSelect('course.users', 'doctors')
			.leftJoinAndSelect('course.softwares', 'software')
			.where('course.id = :id', { id })
			.getOne();

		if (!course) {
			throw new Error('Course not found');
		}

		// Get assigned doctors
		const doctors = await course.users;
		const assignedDoctors = doctors.map((doctor) => doctor.name);

		// Get required software
		const softwares = await course.softwares;
		const requiredSoftware = softwares.map((software) => software.name);

		// Count enrolled students - ensure accurate count
		const numberOfStudents = await this.studentCoursesRepository.count({
			where: { courseId: course.id },
		});

		// Check if course has default group
		const hasDefaultGroup = await this.courseGroupRepository.exists({
			where: { courseId: course.id, isDefault: true },
		});

		// Ensure proper course code formatting
		const courseCode = `${course.subjectCode}${course.courseNumber}`;

		// Ensure proper course type based on hasLab boolean
		const courseType = course.hasLab ? 'Practical' : 'Theory';

		return transformToInstance(imports.GetDto, {
			...course,
			courseCode,
			courseType,
			assignedDoctors,
			requiredSoftware,
			numberOfStudents,
			hasDefaultGroup,
		});
	}
}
