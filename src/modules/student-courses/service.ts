import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Course } from 'src/database/courses/course.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { Student } from 'src/database/students/student.entity';
import { Device } from 'src/database/devices/device.entity';
import { DeviceSoftware } from 'src/database/devices/devices_softwares.entity';
import { Software } from 'src/database/softwares/software.entity';
import { Lab } from 'src/database/labs/lab.entity';
import { UUID } from './imports';
import { transformToInstance } from 'src/base/transformToInstance';
import { EnrollStudentDto } from './dtos';

@Injectable()
export class StudentCourseService {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
		@InjectRepository(Course) private readonly courseRepository: Repository<Course>,
		@InjectRepository(CourseGroup) private readonly courseGroupRepository: Repository<CourseGroup>,
		@InjectRepository(Student) private readonly studentRepository: Repository<Student>,
		@InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
		@InjectRepository(DeviceSoftware) private readonly deviceSoftwareRepository: Repository<DeviceSoftware>,
		@InjectRepository(Software) private readonly softwareRepository: Repository<Software>,
		@InjectRepository(Lab) private readonly labRepository: Repository<Lab>,
	) {}

	async enrollStudent(enrollDto: EnrollStudentDto): Promise<imports.GetDto> {
		// Validate student exists
		const student = await this.studentRepository.findOneBy({ id: enrollDto.studentId });
		if (!student) {
			throw new BadRequestException('Student not found!');
		}

		// Validate course exists
		const course = await this.courseRepository.findOneBy({ id: enrollDto.courseId });
		if (!course) {
			throw new BadRequestException('Course not found!');
		}

		// Check if student is already enrolled
		const existingEnrollment = await this.repository.findOne({
			where: {
				studentId: enrollDto.studentId,
				courseId: enrollDto.courseId,
			},
		});

		if (existingEnrollment) {
			throw new BadRequestException('Student is already enrolled in this course!');
		}

		// Find appropriate course group
		const assignedGroup = await this.findAvailableCourseGroup(enrollDto.courseId);
		if (!assignedGroup) {
			throw new BadRequestException('No available course groups found for this course!');
		}

		// Create enrollment
		const studentCourse = new imports.Entity();
		studentCourse.studentId = enrollDto.studentId;
		studentCourse.courseId = enrollDto.courseId;
		studentCourse.courseGroupId = assignedGroup.id;
		studentCourse.groupNumber = assignedGroup.order;

		const savedEnrollment = await this.repository.save(studentCourse);
		return transformToInstance(imports.GetDto, savedEnrollment);
	}

	private async findAvailableCourseGroup(courseId: UUID): Promise<CourseGroup | null> {
		// Get all course groups for this course ordered by their order
		const courseGroups = await this.courseGroupRepository
			.createQueryBuilder('courseGroup')
			.where('courseGroup.courseId = :courseId', { courseId })
			.orderBy('courseGroup.order', 'ASC')
			.getMany();

		if (courseGroups.length === 0) {
			return null;
		}

		// Calculate capacity for each group and find first available
		for (const group of courseGroups) {
			const capacity = await this.calculateGroupCapacity(group);
			const currentEnrollment = await this.repository.count({
				where: { courseGroupId: group.id },
			});

			if (currentEnrollment < capacity) {
				// Update the group's capacity if it's not set
				if (group.capacity !== capacity) {
					await this.courseGroupRepository.update(group.id, { capacity });
				}
				return group;
			}
		}

		return null;
	}

	private async calculateGroupCapacity(courseGroup: CourseGroup): Promise<number> {
		// Get course software requirements
		const course = await courseGroup.course;
		const courseSoftwares = await course.softwares;
		const courseSoftwareIds = courseSoftwares.map((software) => software.id);

		if (courseSoftwareIds.length === 0) {
			// If no software requirements, capacity is based on lab devices only
			const labDevices = await this.deviceRepository.count({
				where: { labId: courseGroup.labId },
			});
			return labDevices;
		}

		// Find devices in the lab that have all required software with no issues
		const devicesWithAllSoftware = await this.deviceRepository
			.createQueryBuilder('device')
			.where('device.labId = :labId', { labId: courseGroup.labId })
			.andWhere('device.hasIssue = false')
			.andWhere((qb) => {
				const subQuery = qb
					.subQuery()
					.select('COUNT(DISTINCT ds.softwareId)')
					.from(DeviceSoftware, 'ds')
					.where('ds.deviceId = device.id')
					.andWhere('ds.hasIssue = false')
					.andWhere('ds.softwareId IN (:...softwareIds)', { softwareIds: courseSoftwareIds })
					.getQuery();
				return `(${subQuery}) = :requiredCount`;
			})
			.setParameter('requiredCount', courseSoftwareIds.length)
			.getCount();

		return devicesWithAllSoftware;
	}

	async createDefaultCourseGroup(courseId: UUID, labId: UUID): Promise<CourseGroup> {
		const courseGroup = new CourseGroup();
		courseGroup.courseId = courseId;
		courseGroup.labId = labId;
		courseGroup.order = 1;
		courseGroup.isDefault = true;

		// Calculate initial capacity
		const savedGroup = await this.courseGroupRepository.save(courseGroup);
		const capacity = await this.calculateGroupCapacity(savedGroup);
		savedGroup.capacity = capacity;

		return this.courseGroupRepository.save(savedGroup);
	}

	async getPaginated(input: imports.PaginationInput): Promise<imports.IPaginationOutput<imports.GetDto | imports.GetListDto>> {
		const { page, limit, sortBy, sortOrder } = input;
		const skip = page * limit;

		const query = this.repository
			.createQueryBuilder('studentCourse')
			.leftJoinAndSelect('studentCourse.student', 'student')
			.leftJoinAndSelect('student.user', 'user')
			.leftJoinAndSelect('studentCourse.course', 'course')
			.leftJoinAndSelect('studentCourse.courseGroup', 'courseGroup')
			.skip(skip)
			.take(limit);

		// Add filtering if provided
		if ('courseId' in input && input.courseId) {
			query.andWhere('studentCourse.courseId = :courseId', { courseId: input.courseId });
		}

		if ('studentId' in input && input.studentId) {
			query.andWhere('studentCourse.studentId = :studentId', { studentId: input.studentId });
		}

		if (sortBy && sortOrder) {
			query.orderBy(`studentCourse.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
		}

		const [enrollments, total] = await query.getManyAndCount();

		const items = await Promise.all(
			enrollments.map(async (enrollment) => {
				const student = await enrollment.student;
				const user = student ? await student.user : null;
				const course = await enrollment.course;
				const courseGroup = enrollment.courseGroupId ? await enrollment.courseGroup : null;

				return transformToInstance(imports.GetListDto, {
					...enrollment,
					studentName: user ? user.name : 'N/A',
					courseName: course ? course.name : 'N/A',
					courseCode: course ? `${course.subjectCode}${course.courseNumber}` : 'N/A',
					credits: course ? course.creditHours : 0,
					enrolledDate: enrollment.created_at,
					groupCapacity: courseGroup ? courseGroup.capacity : null,
					groupOrder: courseGroup ? courseGroup.order : null,
				});
			}),
		);

		return { items, total };
	}

	async getStudentCourses(studentId: UUID): Promise<imports.GetListDto[]> {
		// Validate student exists
		const student = await this.studentRepository.findOneBy({ id: studentId });
		if (!student) {
			throw new NotFoundException('Student not found!');
		}

		const enrollments = await this.repository
			.createQueryBuilder('studentCourse')
			.leftJoinAndSelect('studentCourse.student', 'student')
			.leftJoinAndSelect('student.user', 'user')
			.leftJoinAndSelect('studentCourse.course', 'course')
			.leftJoinAndSelect('studentCourse.courseGroup', 'courseGroup')
			.where('studentCourse.studentId = :studentId', { studentId })
			.orderBy('studentCourse.created_at', 'DESC')
			.getMany();

		return Promise.all(
			enrollments.map(async (enrollment) => {
				const student = await enrollment.student;
				const user = student ? await student.user : null;
				const course = await enrollment.course;
				const courseGroup = enrollment.courseGroupId ? await enrollment.courseGroup : null;

				return transformToInstance(imports.GetListDto, {
					...enrollment,
					studentName: user ? user.name : 'N/A',
					courseName: course ? course.name : 'N/A',
					courseCode: course ? `${course.subjectCode}${course.courseNumber}` : 'N/A',
					credits: course ? course.creditHours : 0,
					enrolledDate: enrollment.created_at,
					groupCapacity: courseGroup ? courseGroup.capacity : null,
					groupOrder: courseGroup ? courseGroup.order : null,
				});
			}),
		);
	}

	async updateEnrollment(studentId: UUID, courseId: UUID, updateDto: imports.UpdateEnrollmentDto): Promise<imports.GetDto> {
		// Find existing enrollment
		const enrollment = await this.repository.findOne({
			where: {
				studentId,
				courseId,
			},
		});

		if (!enrollment) {
			throw new NotFoundException('Enrollment not found!');
		}

		// If updating course group, validate it exists and belongs to the course
		if (updateDto.courseGroupId) {
			const courseGroup = await this.courseGroupRepository.findOne({
				where: {
					id: updateDto.courseGroupId,
					courseId,
				},
			});

			if (!courseGroup) {
				throw new BadRequestException('Course group not found or does not belong to this course!');
			}

			// Check if the group has capacity
			const capacity = await this.calculateGroupCapacity(courseGroup);
			const currentEnrollment = await this.repository.count({
				where: {
					courseGroupId: updateDto.courseGroupId,
					studentId: Not(studentId) // Exclude current student from count
				},
			});

			if (currentEnrollment >= capacity) {
				throw new BadRequestException('Course group is full!');
			}

			enrollment.courseGroupId = updateDto.courseGroupId;
			enrollment.groupNumber = courseGroup.order;
		}

		// Update group number if provided (and no courseGroupId is being updated)
		if (updateDto.groupNumber !== undefined && !updateDto.courseGroupId) {
			enrollment.groupNumber = updateDto.groupNumber;
		}

		const savedEnrollment = await this.repository.save(enrollment);
		return transformToInstance(imports.GetDto, savedEnrollment);
	}

	async removeStudentFromCourse(studentId: UUID, courseId: UUID): Promise<{ message: string }> {
		// Find existing enrollment
		const enrollment = await this.repository.findOne({
			where: {
				studentId,
				courseId,
			},
		});

		if (!enrollment) {
			throw new NotFoundException('Enrollment not found!');
		}

		await this.repository.remove(enrollment);
		return { message: 'Student successfully removed from course' };
	}

	async getAvailableCourses(): Promise<{ id: UUID; code: string; name: string; credits: number }[]> {
		const courses = await this.courseRepository.find({
			select: ['id', 'name', 'subjectCode', 'courseNumber', 'creditHours'],
			order: {
				subjectCode: 'ASC',
				courseNumber: 'ASC',
			},
		});

		return courses.map(course => ({
			id: course.id,
			code: `${course.subjectCode}${course.courseNumber}`,
			name: course.name,
			credits: course.creditHours,
		}));
	}
}
