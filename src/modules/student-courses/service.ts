import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Course } from 'src/database/courses/course.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { CourseGroupSchedule } from 'src/database/courses/course_labs.entity';
import { Student } from 'src/database/students/student.entity';
import { Device } from 'src/database/devices/device.entity';
import { DeviceSoftware } from 'src/database/devices/devices_softwares.entity';
import { Software } from 'src/database/softwares/software.entity';
import { Lab } from 'src/database/labs/lab.entity';
import { User } from 'src/database/users/user.entity';
import { UUID } from './imports';
import { transformToInstance } from 'src/base/transformToInstance';
import { EnrollStudentDto, StudentWeeklyScheduleDto } from './dtos';

@Injectable()
export class StudentCourseService {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
		@InjectRepository(Course) private readonly courseRepository: Repository<Course>,
		@InjectRepository(CourseGroup) private readonly courseGroupRepository: Repository<CourseGroup>,
		@InjectRepository(CourseGroupSchedule) private readonly scheduleRepository: Repository<CourseGroupSchedule>,
		@InjectRepository(Student) private readonly studentRepository: Repository<Student>,
		@InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
		@InjectRepository(DeviceSoftware) private readonly deviceSoftwareRepository: Repository<DeviceSoftware>,
		@InjectRepository(Software) private readonly softwareRepository: Repository<Software>,
		@InjectRepository(Lab) private readonly labRepository: Repository<Lab>,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
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

	async getPaginated(input: imports.PaginationInput, user?: imports.User): Promise<imports.IPaginationOutput<imports.GetDto | imports.GetListDto>> {
		const { page, limit, sortBy, sortOrder } = input;
		const skip = page * limit;

		const query = this.repository
			.createQueryBuilder('studentCourse')
			.leftJoinAndSelect('studentCourse.student', 'student')
			.leftJoinAndSelect('student.user', 'user')
			.leftJoinAndSelect('studentCourse.course', 'course')
			.leftJoinAndSelect('course.users', 'doctors')
			.leftJoinAndSelect('course.softwares', 'softwares')
			.leftJoinAndSelect('studentCourse.courseGroup', 'courseGroup')
			.skip(skip)
			.take(limit);

		// If user is provided, filter to only show their courses (for students)
		if (user) {
			// Check if user is a student by checking their user type
			const userType = await user.userType;
			if (userType.name === 'Student') {
				query.andWhere('studentCourse.studentId = :currentStudentId', { currentStudentId: user.id });
			}
		}

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

				// Get course doctors and software
				const doctors = course ? await course.users : [];
				const softwares = course ? await course.softwares : [];

				// Count total students in this course
				const numberOfStudents = course ? await this.repository.count({
					where: { courseId: course.id }
				}) : 0;

				return transformToInstance(imports.GetListDto, {
					...enrollment,
					studentName: user ? user.name : 'N/A',
					courseName: course ? course.name : 'N/A',
					courseCode: course ? `${course.subjectCode}${course.courseNumber}` : 'N/A',
					credits: course ? course.creditHours : 0,
					enrolledDate: enrollment.created_at,
					groupCapacity: courseGroup ? courseGroup.capacity : null,
					groupOrder: courseGroup ? courseGroup.order : null,
					groupName: courseGroup ? (courseGroup.isDefault ? 'No Group' : `Group ${String.fromCharCode(64 + courseGroup.order)}`) : 'No Group',
					courseType: course ? (course.hasLab ? 'Practical' : 'Theory') : 'Theory',
					numberOfStudents,
					assignedDoctors: doctors.map((doctor) => doctor.name),
					requiredSoftware: softwares.map((software) => software.name),
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
			.leftJoinAndSelect('course.users', 'doctors')
			.leftJoinAndSelect('course.softwares', 'softwares')
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

				// Get course doctors and software
				const doctors = course ? await course.users : [];
				const softwares = course ? await course.softwares : [];

				// Count total students in this course
				const numberOfStudents = course ? await this.repository.count({
					where: { courseId: course.id }
				}) : 0;

				return transformToInstance(imports.GetListDto, {
					...enrollment,
					studentName: user ? user.name : 'N/A',
					courseName: course ? course.name : 'N/A',
					courseCode: course ? `${course.subjectCode}${course.courseNumber}` : 'N/A',
					credits: course ? course.creditHours : 0,
					enrolledDate: enrollment.created_at,
					groupCapacity: courseGroup ? courseGroup.capacity : null,
					groupOrder: courseGroup ? courseGroup.order : null,
					courseType: course ? (course.hasLab ? 'Practical' : 'Theory') : 'Theory',
					numberOfStudents,
					assignedDoctors: doctors.map((doctor) => doctor.name),
					requiredSoftware: softwares.map((software) => software.name),
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

	async getAvailableCourses(): Promise<imports.AvailableCourseDto[]> {
		const courses = await this.courseRepository.find();
		return courses.map((course) =>
			transformToInstance(imports.AvailableCourseDto, {
				id: course.id,
				code: `${course.subjectCode}${course.courseNumber}`,
				name: course.name,
				credits: course.creditHours,
			})
		);
	}

	async getCourseStudents(courseId: UUID): Promise<imports.GetListDto[]> {
		// Validate course exists
		const course = await this.courseRepository.findOneBy({ id: courseId });
		if (!course) {
			throw new NotFoundException('Course not found!');
		}

		// Get all students enrolled in this course
		const enrollments = await this.repository
			.createQueryBuilder('studentCourse')
			.leftJoinAndSelect('studentCourse.student', 'student')
			.leftJoinAndSelect('student.user', 'user')
			.leftJoinAndSelect('studentCourse.course', 'course')
			.leftJoinAndSelect('course.users', 'doctors')
			.leftJoinAndSelect('course.softwares', 'softwares')
			.leftJoinAndSelect('studentCourse.courseGroup', 'courseGroup')
			.where('studentCourse.courseId = :courseId', { courseId })
			.orderBy('user.name', 'ASC')
			.getMany();

		const items = await Promise.all(
			enrollments.map(async (enrollment) => {
				const student = await enrollment.student;
				const user = student ? await student.user : null;
				const course = await enrollment.course;
				const courseGroup = enrollment.courseGroupId ? await enrollment.courseGroup : null;

				// Get course doctors and software
				const doctors = course ? await course.users : [];
				const softwares = course ? await course.softwares : [];

				// Count total students in this course
				const numberOfStudents = course ? await this.repository.count({
					where: { courseId: course.id }
				}) : 0;

				return transformToInstance(imports.GetListDto, {
					...enrollment,
					studentName: user ? user.name : 'N/A',
					username: user ? user.username : 'N/A',
					studentId: student ? student.id : 'N/A',
					email: user ? user.email : 'N/A',
					courseName: course ? course.name : 'N/A',
					courseCode: course ? `${course.subjectCode}${course.courseNumber}` : 'N/A',
					credits: course ? course.creditHours : 0,
					enrolledDate: enrollment.created_at,
					groupCapacity: courseGroup ? courseGroup.capacity : null,
					groupOrder: courseGroup ? courseGroup.order : null,
					groupName: courseGroup ? (courseGroup.isDefault ? 'No Group' : `Group ${String.fromCharCode(64 + courseGroup.order)}`) : 'No Group',
					courseType: course ? (course.hasLab ? 'Practical' : 'Theory') : 'Theory',
					numberOfStudents,
					assignedDoctors: doctors.map((doctor) => doctor.name),
					requiredSoftware: softwares.map((software) => software.name),
				});
			}),
		);

		return items;
	}

	async getStudentGroupDetails(studentId: UUID, courseId: UUID): Promise<imports.GetListDto> {
		// Find student enrollment in the course
		const enrollment = await this.repository
			.createQueryBuilder('studentCourse')
			.leftJoinAndSelect('studentCourse.student', 'student')
			.leftJoinAndSelect('student.user', 'user')
			.leftJoinAndSelect('studentCourse.course', 'course')
			.leftJoinAndSelect('course.users', 'doctors')
			.leftJoinAndSelect('course.softwares', 'softwares')
			.leftJoinAndSelect('studentCourse.courseGroup', 'courseGroup')
			.leftJoinAndSelect('courseGroup.lab', 'lab')
			.where('studentCourse.studentId = :studentId', { studentId })
			.andWhere('studentCourse.courseId = :courseId', { courseId })
			.getOne();

		if (!enrollment) {
			throw new NotFoundException('Student enrollment not found!');
		}

		const student = await enrollment.student;
		const user = student ? await student.user : null;
		const course = await enrollment.course;
		const courseGroup = enrollment.courseGroupId ? await enrollment.courseGroup : null;
		const lab = courseGroup?.labId ? await courseGroup.lab : null;

		// Get course doctors and software
		const doctors = course ? await course.users : [];
		const softwares = course ? await course.softwares : [];

		// Count total students in this course
		const numberOfStudents = course ? await this.repository.count({
			where: { courseId: course.id }
		}) : 0;

		// Count students in same group
		const groupStudentsCount = courseGroup ? await this.repository.count({
			where: { courseGroupId: courseGroup.id }
		}) : 0;

		return transformToInstance(imports.GetListDto, {
			...enrollment,
			studentName: user ? user.name : 'N/A',
			username: user ? user.username : 'N/A',
			email: user ? user.email : 'N/A',
			courseName: course ? course.name : 'N/A',
			courseCode: course ? `${course.subjectCode}${course.courseNumber}` : 'N/A',
			credits: course ? course.creditHours : 0,
			enrolledDate: enrollment.created_at,
			groupCapacity: courseGroup ? courseGroup.capacity : null,
			groupOrder: courseGroup ? courseGroup.order : null,
			groupName: courseGroup ? (courseGroup.isDefault ? 'No Group' : `Group ${String.fromCharCode(64 + courseGroup.order)}`) : 'No Group',
			courseType: course ? (course.hasLab ? 'Practical' : 'Theory') : 'Theory',
			numberOfStudents,
			groupStudentsCount,
			labName: lab ? lab.name : 'No Lab Assigned',
			labRoom: lab ? lab.location : null,
			assignedDoctors: doctors.map((doctor) => doctor.name),
			requiredSoftware: softwares.map((software) => software.name),
		});
	}

	async getGroupStudents(groupId: UUID): Promise<imports.GetListDto[]> {
		// Validate group exists
		const group = await this.courseGroupRepository.findOneBy({ id: groupId });
		if (!group) {
			throw new NotFoundException('Course group not found!');
		}

		// Get all students in this group
		const enrollments = await this.repository
			.createQueryBuilder('studentCourse')
			.leftJoinAndSelect('studentCourse.student', 'student')
			.leftJoinAndSelect('student.user', 'user')
			.leftJoinAndSelect('studentCourse.course', 'course')
			.leftJoinAndSelect('course.users', 'doctors')
			.leftJoinAndSelect('course.softwares', 'softwares')
			.leftJoinAndSelect('studentCourse.courseGroup', 'courseGroup')
			.where('studentCourse.courseGroupId = :groupId', { groupId })
			.orderBy('user.name', 'ASC')
			.getMany();

		const items = await Promise.all(
			enrollments.map(async (enrollment) => {
				const student = await enrollment.student;
				const user = student ? await student.user : null;
				const course = await enrollment.course;
				const courseGroup = enrollment.courseGroupId ? await enrollment.courseGroup : null;

				// Get course doctors and software
				const doctors = course ? await course.users : [];
				const softwares = course ? await course.softwares : [];

				// Count total students in this course
				const numberOfStudents = course ? await this.repository.count({
					where: { courseId: course.id }
				}) : 0;

				return transformToInstance(imports.GetListDto, {
					...enrollment,
					studentName: user ? user.name : 'N/A',
					username: user ? user.username : 'N/A',
					email: user ? user.email : 'N/A',
					courseName: course ? course.name : 'N/A',
					courseCode: course ? `${course.subjectCode}${course.courseNumber}` : 'N/A',
					credits: course ? course.creditHours : 0,
					enrolledDate: enrollment.created_at,
					groupCapacity: courseGroup ? courseGroup.capacity : null,
					groupOrder: courseGroup ? courseGroup.order : null,
					groupName: courseGroup ? (courseGroup.isDefault ? 'No Group' : `Group ${String.fromCharCode(64 + courseGroup.order)}`) : 'No Group',
					courseType: course ? (course.hasLab ? 'Practical' : 'Theory') : 'Theory',
					numberOfStudents,
					assignedDoctors: doctors.map((doctor) => doctor.name),
					requiredSoftware: softwares.map((software) => software.name),
				});
			}),
		);

		return items;
	}

	// NEW: Get student weekly schedule
	async getStudentWeeklySchedule(studentId: UUID): Promise<StudentWeeklyScheduleDto[]> {
		// Validate student exists
		const student = await this.studentRepository.findOneBy({ id: studentId });
		if (!student) {
			throw new NotFoundException('Student not found!');
		}
		// Get all student course enrollments with schedules
		const query = `
			SELECT DISTINCT
				sc.course_id as "courseId",
				c.name as "courseName",
				CONCAT(c.subjectCode, c.courseNumber) as "courseCode",
				CASE 
					WHEN cg.isDefault = 1 THEN 'No Group'
					ELSE CONCAT('Group ', CHAR(cg.\`order\` + 64))
				END as "groupName",
				COALESCE(l.name, 'No Lab Assigned') as "labName",
				cgs.weekDay as "weekDay",
				cgs.startTime as "startTime",
				cgs.endTime as "endTime",
				u.name as "assistantName"
			FROM student_courses sc
			INNER JOIN courses c ON sc.course_id = c.id
			LEFT JOIN course_groups cg ON sc.course_group_id = cg.id
			LEFT JOIN labs l ON cg.lab_id = l.id
			LEFT JOIN course_group_schedules cgs ON cg.id = cgs.course_group_id
			LEFT JOIN users u ON cgs.assistant_id = u.id
			WHERE sc.student_id = ?
			AND cgs.weekDay IS NOT NULL
			ORDER BY 
				CASE cgs.weekDay
					WHEN 'Saturday' THEN 1
					WHEN 'Sunday' THEN 2
					WHEN 'Monday' THEN 3
					WHEN 'Tuesday' THEN 4
					WHEN 'Wednesday' THEN 5
					WHEN 'Thursday' THEN 6
					WHEN 'Friday' THEN 7
				END,
				cgs.startTime
		`;

		const rawResults = await this.repository.manager.query(query, [studentId]);

		// Group assistants by schedule
		const scheduleMap = new Map<string, StudentWeeklyScheduleDto>();

		for (const row of rawResults) {
			const key = `${row.courseId}-${row.weekDay}-${row.startTime}-${row.endTime}`;

			if (scheduleMap.has(key)) {
				// Add assistant to existing schedule
				const existingSchedule = scheduleMap.get(key);
				if (row.assistantName && !existingSchedule.teachingAssistants.includes(row.assistantName)) {
					existingSchedule.teachingAssistants.push(row.assistantName);
				}
			} else {
				// Create new schedule entry
				const schedule = transformToInstance(StudentWeeklyScheduleDto, {
					courseId: row.courseId,
					courseName: row.courseName,
					courseCode: row.courseCode,
					groupName: row.groupName,
					labName: row.labName,
					weekDay: row.weekDay,
					startTime: row.startTime,
					endTime: row.endTime,
					teachingAssistants: row.assistantName ? [row.assistantName] : []
				});
				scheduleMap.set(key, schedule);
			}
		}

		return Array.from(scheduleMap.values());
	}
}
