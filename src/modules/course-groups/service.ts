import { BadRequestException, Injectable } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import { Course } from 'src/database/courses/course.entity';
import { Lab } from 'src/database/labs/lab.entity';
import { Device } from 'src/database/devices/device.entity';
import { DeviceSoftware } from 'src/database/devices/devices_softwares.entity';
import { StudentCourses } from 'src/database/students/student_courses.entity';
import { CourseGroupSchedule } from 'src/database/courses/course_labs.entity';
import { User } from 'src/database/users/user.entity';
import { transformToInstance } from 'src/base/transformToInstance';
import { CourseGroupScheduleTableDto, CreateCourseGroupScheduleDto, UpdateCourseGroupScheduleDto, CourseGroupScheduleTablePaginationInput } from './dtos';

@Injectable()
export class CourseGroupService extends BaseService<imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
		@InjectRepository(Course) private readonly courseRepository: Repository<Course>,
		@InjectRepository(Lab) private readonly labRepository: Repository<Lab>,
		@InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
		@InjectRepository(DeviceSoftware) private readonly deviceSoftwareRepository: Repository<DeviceSoftware>,
		@InjectRepository(StudentCourses) private readonly studentCoursesRepository: Repository<StudentCourses>,
		@InjectRepository(CourseGroupSchedule) private readonly scheduleRepository: Repository<CourseGroupSchedule>,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
	) {
		super(imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto, repository);
	}

	async beforeCreateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		// Validate course exists
		const course = await this.courseRepository.findOneBy({ id: dto.courseId });
		if (!course) {
			throw new BadRequestException('Course not found!');
		}

		// Validate lab exists (only if labId is provided)
		if (dto.labId) {
			const lab = await this.labRepository.findOneBy({ id: dto.labId });
			if (!lab) {
				throw new BadRequestException('Lab not found!');
			}
		}

		// Validate order uniqueness within course
		const existingGroup = await this.repository.findOne({
			where: { courseId: dto.courseId, order: dto.order },
		});
		if (existingGroup) {
			throw new BadRequestException('Course group with this order already exists for this course!');
		}

		return dto;
	}

	async create(createDto: imports.CreateDto): Promise<imports.GetDto> {
		const courseGroup = await super.create(createDto);

		// Calculate and update capacity
		const capacity = await this.calculateGroupCapacity(courseGroup.id);
		await this.repository.update(courseGroup.id, { capacity });

		return this.getById(courseGroup.id);
	}

	private async calculateGroupCapacity(groupId: imports.UUID): Promise<number> {
		const courseGroup = await this.repository.findOneBy({ id: groupId });
		if (!courseGroup) {
			return 0;
		}

		// If no lab is assigned, capacity is 0
		if (!courseGroup.labId) {
			return 0;
		}

		// Get course software requirements
		const course = await this.courseRepository.findOneBy({ id: courseGroup.courseId });
		if (!course) {
			return 0;
		}

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

	async getPaginated(input: imports.PaginationInput): Promise<imports.IPaginationOutput<imports.GetDto | imports.GetListDto>> {
		const { page, limit, sortBy, sortOrder } = input;
		const skip = page * limit;

		const query = this.repository
			.createQueryBuilder('courseGroup')
			.leftJoinAndSelect('courseGroup.course', 'course')
			.leftJoinAndSelect('courseGroup.lab', 'lab')
			.skip(skip)
			.take(limit);

		// Add filtering if provided
		if ('courseId' in input && input.courseId) {
			query.andWhere('courseGroup.courseId = :courseId', { courseId: input.courseId });
		}

		if ('labId' in input && input.labId) {
			query.andWhere('courseGroup.labId = :labId', { labId: input.labId });
		}

		if (sortBy && sortOrder) {
			query.orderBy(`courseGroup.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
		} else {
			query.orderBy('courseGroup.order', 'ASC');
		}

		const [courseGroups, total] = await query.getManyAndCount();

		const items = await Promise.all(
			courseGroups.map(async (courseGroup) => {
				const course = await courseGroup.course;
				const lab = await courseGroup.lab;
				const currentEnrollment = await this.studentCoursesRepository.count({
					where: { courseGroupId: courseGroup.id },
				});

				return transformToInstance(imports.GetListDto, {
					...courseGroup,
					courseName: course ? course.name : 'N/A',
					labName: lab ? lab.name : 'N/A',
					currentEnrollment,
				});
			}),
		);

		return { items, total };
	}

	// NEW: Get course group schedules for table display
	async getScheduleTable(input: CourseGroupScheduleTablePaginationInput): Promise<imports.IPaginationOutput<CourseGroupScheduleTableDto>> {
		const { page, limit, sortBy, sortOrder, courseId, labId, weekDay, search } = input;
		const skip = page * limit;

		const query = this.repository
			.createQueryBuilder('courseGroup')
			.leftJoinAndSelect('courseGroup.course', 'course')
			.leftJoinAndSelect('courseGroup.lab', 'lab')
			.skip(skip)
			.take(limit);

		// Add filtering
		if (courseId) {
			query.andWhere('courseGroup.courseId = :courseId', { courseId });
		}

		if (labId) {
			query.andWhere('courseGroup.labId = :labId', { labId });
		}

		if (search) {
			query.andWhere('(course.name LIKE :search OR lab.name LIKE :search)', { search: `%${search}%` });
		}

		if (sortBy && sortOrder) {
			query.orderBy(`courseGroup.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
		} else {
			query.orderBy('courseGroup.order', 'ASC');
		}

		const [courseGroups, total] = await query.getManyAndCount();

		const items = await Promise.all(
			courseGroups.map(async (courseGroup) => {
				const course = await courseGroup.course;
				const lab = courseGroup.labId ? await courseGroup.lab : null;
				const currentEnrollment = await this.studentCoursesRepository.count({
					where: { courseGroupId: courseGroup.id },
				});

				// Get schedule details with proper relations
				const schedules = await this.scheduleRepository.find({
					where: { courseGroupId: courseGroup.id },
					relations: ['assistant'],
				});

				// Filter by weekDay if provided
				const filteredSchedules = weekDay ? schedules.filter((s) => s.weekDay === weekDay) : schedules;

				const schedule = filteredSchedules[0]; // Get first schedule for basic info
				const assistantNames = await Promise.all(
					filteredSchedules.map(async (s) => {
						const assistant = await s.assistant;
						return assistant.name;
					}),
				);

				return transformToInstance(CourseGroupScheduleTableDto, {
					id: courseGroup.id,
					groupName: `Group ${String.fromCharCode(64 + courseGroup.order)}`, // A, B, C, etc.
					labName: lab?.name || 'No Lab Assigned',
					weekDay: schedule?.weekDay || 'Not Scheduled',
					timeSlot: schedule ? `${schedule.startTime} - ${schedule.endTime}` : 'Not Scheduled',
					teachingAssistants: assistantNames,
					currentEnrollment,
					totalCapacity: courseGroup.capacity || 0,
					labId: courseGroup.labId || null,
					courseId: courseGroup.courseId,
					isDefault: courseGroup.isDefault,
				});
			}),
		);

		return { items, total };
	}

	// NEW: Create course group schedule
	async createSchedule(createDto: CreateCourseGroupScheduleDto): Promise<CourseGroupSchedule> {
		// Validate course group exists
		const courseGroup = await this.repository.findOneBy({ id: createDto.courseGroupId });
		if (!courseGroup) {
			throw new BadRequestException('Course group not found!');
		}

		// Validate assistant exists
		const assistant = await this.userRepository.findOneBy({ id: createDto.assistantId });
		if (!assistant) {
			throw new BadRequestException('Assistant not found!');
		}

		// Check for schedule conflicts
		const existingSchedule = await this.scheduleRepository.findOne({
			where: {
				courseGroupId: createDto.courseGroupId,
				assistantId: createDto.assistantId,
				weekDay: createDto.weekDay,
				startTime: createDto.startTime,
			},
		});

		if (existingSchedule) {
			throw new BadRequestException('Schedule already exists for this assistant at this time!');
		}

		const schedule = this.scheduleRepository.create({
			...createDto,
			courseId: courseGroup.courseId,
			labId: courseGroup.labId || null, // Use the course group's labId (may be null)
		});

		return this.scheduleRepository.save(schedule);
	}

	// NEW: Update course group schedule
	async updateSchedule(courseGroupId: imports.UUID, assistantId: imports.UUID, updateDto: UpdateCourseGroupScheduleDto): Promise<CourseGroupSchedule> {
		const schedule = await this.scheduleRepository.findOne({
			where: { courseGroupId, assistantId },
		});

		if (!schedule) {
			throw new BadRequestException('Schedule not found!');
		}

		Object.assign(schedule, updateDto);
		return this.scheduleRepository.save(schedule);
	}

	// NEW: Delete course group schedule
	async deleteSchedule(courseGroupId: imports.UUID, assistantId: imports.UUID): Promise<void> {
		const result = await this.scheduleRepository.delete({
			courseGroupId,
			assistantId,
		});

		if (result.affected === 0) {
			throw new BadRequestException('Schedule not found!');
		}
	}
}
