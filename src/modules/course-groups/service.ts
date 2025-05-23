import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, EntityManager } from 'typeorm';
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
	private readonly logger = new Logger(CourseGroupService.name);

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

		// Prevent assigning labs to default groups
		if (dto.isDefault && dto.labId) {
			throw new BadRequestException('Default groups cannot be assigned to labs!');
		}

		// Validate lab exists (only if labId is provided)
		if (dto.labId) {
			const lab = await this.labRepository.findOneBy({ id: dto.labId });
			if (!lab) {
				throw new BadRequestException('Lab not found!');
			}
		}

		// If creating a default group, set order to 999 for lowest priority
		if (dto.isDefault) {
			dto.order = 999;
		} else {
			// For non-default groups, auto-calculate the next available order if not provided
			// or validate the provided order if it was explicitly set
			if (dto.order === undefined || dto.order === null) {
				// Auto-calculate the next available order
				const maxOrderResult = await this.repository
					.createQueryBuilder('courseGroup')
					.select('MAX(courseGroup.order)', 'maxOrder')
					.where('courseGroup.courseId = :courseId', { courseId: dto.courseId })
					.andWhere('courseGroup.isDefault = false') // Exclude default group from max calculation
					.getRawOne();

				const nextOrder = (maxOrderResult?.maxOrder || 0) + 1;

				// Ensure the calculated order is within valid range (1-998)
				if (nextOrder >= 999) {
					throw new BadRequestException('Maximum number of groups (998) reached for this course!');
				}

				dto.order = nextOrder;
			} else {
				// Validate explicitly provided order
				const existingGroup = await this.repository.findOne({
					where: { courseId: dto.courseId, order: dto.order },
				});
				if (existingGroup) {
					throw new BadRequestException('Course group with this order already exists for this course!');
				}

				// Ensure non-default groups have reasonable order values (1-998)
				if (dto.order < 1 || dto.order >= 999) {
					throw new BadRequestException('Group order must be between 1 and 998!');
				}
			}
		}

		return dto;
	}

	async create(createDto: imports.CreateDto): Promise<imports.GetDto> {
		const maxNonDefaultOrder = await this.repository.count({ where: { courseId: createDto.courseId, isDefault: false } });
		const courseGroup = await super.create({ ...createDto, groupNumber: maxNonDefaultOrder + 1 } as any);

		// Calculate and update capacity
		const capacity = await this.calculateGroupCapacity(courseGroup.id);
		await this.repository.update(courseGroup.id, { capacity });

		return this.getById(courseGroup.id);
	}

	/**
	 * Calculate lab capacity for a specific course based on software requirements
	 */
	async calculateLabCapacityForCourse(labId: imports.UUID, courseId: imports.UUID): Promise<number> {
		// Get course software requirements
		const course = await this.courseRepository.findOneBy({ id: courseId });
		if (!course) {
			return 0;
		}

		const courseSoftwares = await course.softwares;
		const courseSoftwareIds = courseSoftwares.map((software) => software.id);

		if (courseSoftwareIds.length === 0) {
			// If no software requirements, capacity is based on available devices only
			const labDevices = await this.deviceRepository.count({
				where: { labId, status: 'available' },
			});
			return labDevices;
		}

		// Find devices in the lab that are available and have all required software available
		const devicesWithAllSoftware = await this.deviceRepository
			.createQueryBuilder('device')
			.where('device.labId = :labId', { labId })
			.andWhere('device.status = :deviceStatus', { deviceStatus: 'available' })
			.andWhere((qb: any) => {
				const subQuery = qb
					.subQuery()
					.select('COUNT(DISTINCT ds.softwareId)')
					.from(DeviceSoftware, 'ds')
					.where('ds.deviceId = device.id')
					.andWhere('ds.status = :softwareStatus', { softwareStatus: 'available' })
					.andWhere('ds.softwareId IN (:...softwareIds)', { softwareIds: courseSoftwareIds })
					.getQuery();
				return `(${subQuery}) = :requiredCount`;
			})
			.setParameter('requiredCount', courseSoftwareIds.length)
			.getCount();

		return devicesWithAllSoftware;
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

		// Use the new reusable calculation function
		return this.calculateLabCapacityForCourse(courseGroup.labId, courseGroup.courseId);
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
		input.sortBy = 'order';
		input.sortOrder = 'asc';
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

				// Calculate live capacity instead of using stored value
				const liveCapacity = courseGroup.labId
					? await this.calculateLabCapacityForCourse(courseGroup.labId, courseGroup.courseId)
					: 0;

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
					groupName: courseGroup.isDefault ? 'No Group' : `Group ${String.fromCharCode(64 + courseGroup.groupNumber)}`, // A, B, C, etc.
					labName: lab?.name || 'No Lab Assigned',
					weekDay: schedule?.weekDay || 'Not Scheduled',
					timeSlot: schedule ? `${schedule.startTime} - ${schedule.endTime}` : 'Not Scheduled',
					teachingAssistants: assistantNames,
					currentEnrollment,
					totalCapacity: liveCapacity, // Use live calculated capacity
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

	async update(id: imports.UUID, updateDto: imports.UpdateDto): Promise<imports.GetDto> {
		const existingGroup = await this.repository.findOneBy({ id });
		if (!existingGroup) {
			throw new BadRequestException('Course group not found!');
		}

		// Prevent modifying default group properties that should be restricted
		if (existingGroup.isDefault) {
			if (updateDto.labId !== undefined) {
				throw new BadRequestException('Default groups cannot be assigned to labs!');
			}
			if (updateDto.isDefault === false) {
				throw new BadRequestException('Cannot change default group to non-default!');
			}
		}

		// If changing order for non-default group, validate constraints
		if (updateDto.order !== undefined && !existingGroup.isDefault) {
			// Ensure non-default groups have reasonable order values (1-998)
			if (updateDto.order < 1 || updateDto.order >= 999) {
				throw new BadRequestException('Group order must be between 1 and 998!');
			}
		}

		// If updating order for default group, keep it at 999
		if (updateDto.order !== undefined && existingGroup.isDefault) {
			updateDto.order = 999;
		}

		const result = await super.update(id, updateDto);

		// Recalculate capacity if lab was changed
		if (updateDto.labId !== undefined) {
			const capacity = await this.calculateGroupCapacity(id);
			await this.repository.update(id, { capacity });
		}

		return this.getById(id);
	}

	async delete(ids: imports.UUID[]): Promise<imports.DeleteDto> {
		// Check if any of the groups to be deleted are default groups
		const defaultGroups = await this.repository.find({
			where: { id: In(ids), isDefault: true },
		});

		if (defaultGroups.length > 0) {
			throw new BadRequestException('Cannot delete default groups!');
		}

		// Use a transaction to ensure data consistency
		return await this.repository.manager.transaction(async (transactionalEntityManager) => {
			// For each group to be deleted, move all students to the default group
			for (const groupId of ids) {
				await this.moveStudentsToDefaultGroupInTransaction(groupId, transactionalEntityManager);
			}

			// Delete the course groups
			const result = await transactionalEntityManager.delete(this.repository.target, ids);

			return {
				message: `Successfully deleted ${result.affected} course group(s) and moved all students to default groups.`,
				affected: result.affected || 0,
			};
		});
	}

	/**
 * Move all students from a course group to the default group of the same course
 */
	private async moveStudentsToDefaultGroup(groupId: imports.UUID): Promise<void> {
		return this.moveStudentsToDefaultGroupInTransaction(groupId, this.repository.manager);
	}

	/**
	 * Move all students from a course group to the default group of the same course (transaction-aware)
	 */
	private async moveStudentsToDefaultGroupInTransaction(groupId: imports.UUID, entityManager: EntityManager): Promise<void> {
		// Get the course group to find its course
		const courseGroup = await entityManager.findOneBy(this.repository.target, { id: groupId });
		if (!courseGroup) {
			// Group doesn't exist, nothing to do
			return;
		}

		// Find the default group for this course
		const defaultGroup = await entityManager.findOne(this.repository.target, {
			where: {
				courseId: courseGroup.courseId,
				isDefault: true
			},
		});

		if (!defaultGroup) {
			throw new BadRequestException(
				`No default group found for course. Cannot move students from group ${groupId}.`
			);
		}

		// Get all students currently in this group
		const studentsInGroup = await entityManager.find(StudentCourses, {
			where: { courseGroupId: groupId },
		});

		if (studentsInGroup.length === 0) {
			// No students to move
			return;
		}

		// Move all students to the default group
		await entityManager.update(
			StudentCourses,
			{ courseGroupId: groupId },
			{
				courseGroupId: defaultGroup.id,
				groupNumber: defaultGroup.groupNumber
			}
		);

		// Log the operation for audit purposes
		this.logger.log(
			`Moved ${studentsInGroup.length} students from group ${groupId} to default group ${defaultGroup.id} for course ${courseGroup.courseId}`
		);
	}

	async getStudentsInDefaultGroup(courseId: imports.UUID): Promise<number> {
		const defaultGroup = await this.repository.findOne({
			where: { courseId, isDefault: true },
		});

		if (!defaultGroup) {
			return 0;
		}

		return this.studentCoursesRepository.count({
			where: { courseGroupId: defaultGroup.id },
		});
	}

	async getAvailableDevicesForLab(labId: imports.UUID, courseId: imports.UUID): Promise<imports.LabCapacityDto> {
		// Get course software requirements
		const course = await this.courseRepository.findOneBy({ id: courseId });
		if (!course) {
			throw new BadRequestException('Course not found!');
		}

		const courseSoftwares = await course.softwares;
		const courseSoftwareIds = courseSoftwares.map((software) => software.id);
		const requiredSoftware = courseSoftwares.map((software) => software.name);

		// Get total devices in lab
		const totalDevices = await this.deviceRepository.count({
			where: { labId },
		});

		if (courseSoftwareIds.length === 0) {
			// If no software requirements, available devices are all available (status = 'available') devices
			const availableDevices = await this.deviceRepository.count({
				where: { labId, status: 'available' },
			});

			return transformToInstance(imports.LabCapacityDto, {
				availableDevices,
				totalDevices,
				requiredSoftware,
			});
		}

		// Find devices in the lab that are available and have all required software available
		const availableDevices = await this.deviceRepository
			.createQueryBuilder('device')
			.where('device.labId = :labId', { labId })
			.andWhere('device.status = :deviceStatus', { deviceStatus: 'available' })
			.andWhere((qb) => {
				const subQuery = qb
					.subQuery()
					.select('COUNT(DISTINCT ds.softwareId)')
					.from(DeviceSoftware, 'ds')
					.where('ds.deviceId = device.id')
					.andWhere('ds.status = :softwareStatus', { softwareStatus: 'available' })
					.andWhere('ds.softwareId IN (:...softwareIds)', { softwareIds: courseSoftwareIds })
					.getQuery();
				return `(${subQuery}) = :requiredCount`;
			})
			.setParameter('requiredCount', courseSoftwareIds.length)
			.getCount();

		return transformToInstance(imports.LabCapacityDto, {
			availableDevices,
			totalDevices,
			requiredSoftware,
		});
	}

	async getAssistantGroups(assistantId: imports.UUID, courseId: imports.UUID): Promise<CourseGroupScheduleTableDto[]> {
		// Get all course groups where the assistant has schedules for the given course
		const schedules = await this.scheduleRepository
			.createQueryBuilder('schedule')
			.leftJoinAndSelect('schedule.courseGroup', 'courseGroup')
			.leftJoinAndSelect('courseGroup.lab', 'lab')
			.leftJoinAndSelect('schedule.assistant', 'assistant')
			.where('schedule.assistantId = :assistantId', { assistantId })
			.andWhere('schedule.courseId = :courseId', { courseId })
			.orderBy('courseGroup.order', 'ASC')
			.getMany();

		// Group schedules by course group
		const groupedSchedules = schedules.reduce((acc, schedule) => {
			const groupId = schedule.courseGroupId;
			if (!acc[groupId]) {
				acc[groupId] = [];
			}
			acc[groupId].push(schedule);
			return acc;
		}, {} as { [key: string]: any[] });

		const items = await Promise.all(
			Object.entries(groupedSchedules).map(async ([groupId, groupSchedules]) => {
				const firstSchedule = groupSchedules[0];
				const courseGroup = await firstSchedule.courseGroup;
				const lab = courseGroup.labId ? await courseGroup.lab : null;

				// Get current enrollment for this group
				const currentEnrollment = await this.studentCoursesRepository.count({
					where: { courseGroupId: groupId as imports.UUID },
				});

				// Get all assistants for this group
				const allSchedulesForGroup = await this.scheduleRepository.find({
					where: { courseGroupId: groupId as imports.UUID },
					relations: ['assistant'],
				});

				const assistantNames = await Promise.all(
					allSchedulesForGroup.map(async (s) => {
						const assistant = await s.assistant;
						return assistant.name;
					}),
				);

				return transformToInstance(CourseGroupScheduleTableDto, {
					id: courseGroup.id,
					groupName: courseGroup.isDefault ? 'No Group' : `Group ${String.fromCharCode(64 + courseGroup.order)}`, // A, B, C, etc.
					labName: lab?.name || 'No Lab Assigned',
					weekDay: firstSchedule.weekDay || 'Not Scheduled',
					timeSlot: `${firstSchedule.startTime} - ${firstSchedule.endTime}`,
					teachingAssistants: assistantNames,
					currentEnrollment,
					totalCapacity: courseGroup.capacity || 0,
					labId: courseGroup.labId || null,
					courseId: courseGroup.courseId,
					isDefault: courseGroup.isDefault,
				});
			}),
		);

		return items;
	}

	async reorderGroups(courseId: imports.UUID, groupIds: imports.UUID[]): Promise<any> {
		// Get all groups for this course
		const allGroups = await this.repository.find({
			where: { courseId },
			order: { order: 'ASC' }
		});

		// Separate default and non-default groups
		const defaultGroups = allGroups.filter(group => group.isDefault);
		const nonDefaultGroups = allGroups.filter(group => !group.isDefault);

		// Validate that all provided groupIds exist and are non-default
		const providedGroups = groupIds.map(id => {
			const group = allGroups.find(g => g.id === id);
			if (!group) {
				throw new BadRequestException(`Group with ID ${id} not found`);
			}
			if (group.isDefault) {
				throw new BadRequestException('Cannot reorder default groups');
			}
			return group;
		});

		// Ensure all non-default groups are included in the reorder
		if (providedGroups.length !== nonDefaultGroups.length) {
			throw new BadRequestException('Must provide all non-default group IDs for reordering');
		}

		// Use a transaction to perform bulk update
		return await this.repository.manager.transaction(async (entityManager) => {
			// Step 1: Temporarily set all non-default groups to high order values to avoid conflicts
			// Start from 10000 to ensure no conflicts with new orders
			const tempOrderOffset = 10000;
			await entityManager.query(
				`UPDATE course_groups SET \`order\` = \`order\` + ? WHERE course_id = ? AND isDefault = false`,
				[tempOrderOffset, courseId]
			);

			// Step 2: Update groups to their new order values using CASE statement for bulk update
			const caseStatements = groupIds.map((groupId, index) =>
				`WHEN id = '${groupId}' THEN ${index + 1}`
			).join(' ');

			const updateQuery = `
				UPDATE course_groups 
				SET \`order\` = CASE 
					${caseStatements}
					ELSE \`order\`
				END
				WHERE id IN (${groupIds.map(id => `'${id}'`).join(',')})
			`;

			await entityManager.query(updateQuery);

			// Step 3: Ensure default groups remain at order 999
			if (defaultGroups.length > 0) {
				await entityManager.query(
					`UPDATE course_groups SET \`order\` = 999 WHERE course_id = ? AND isDefault = true`,
					[courseId]
				);
			}

			// Return updated groups in new order
			return await entityManager.find(this.repository.target, {
				where: { courseId },
				order: { order: 'ASC' }
			});
		});
	}

	/**
	 * Get group details with students
	 */
	async getGroupWithStudents(groupId: imports.UUID): Promise<any> {
		const group = await this.repository.findOne({
			where: { id: groupId },
			relations: ['course', 'lab']
		});

		if (!group) {
			throw new BadRequestException('Group not found');
		}

		// Get students in this group with proper seatNo fetching
		const students = await this.userRepository
			.createQueryBuilder('user')
			.leftJoin('student_courses', 'sc', 'sc.student_id = user.id')
			.leftJoin('students', 'student', 'student.id = user.id')
			.select([
				'user.id',
				'user.name',
				'user.username',
				'student.seatNo as seatNo'
			])
			.where('sc.course_group_id = :groupId', { groupId })
			.getRawMany();

		// Get course and lab information
		const course = await group.course;
		const lab = group.labId ? await group.lab : null;

		// Calculate effective capacity
		const effectiveCapacity = await this.calculateLabCapacityForCourse(group.labId, group.courseId);

		return {
			id: group.id,
			groupName: group.isDefault ? 'No Group' : `Group ${String.fromCharCode(64 + group.order)}`,
			order: group.order,
			capacity: effectiveCapacity,
			actualCapacity: group.capacity,
			isDefault: group.isDefault,
			course: {
				id: course.id,
				name: course.name,
				subjectCode: course.subjectCode,
				courseNumber: course.courseNumber
			},
			lab: lab ? {
				id: lab.id,
				name: lab.name,
				capacity: lab.capacity
			} : null,
			students: students.map(student => ({
				id: student.user_id,
				name: student.user_name,
				username: student.user_username,
				seatNo: student.seatNo || 'N/A'
			})),
			studentCount: students.length
		};
	}

	/**
	 * Get group details with schedule for editing
	 */
	async getGroupWithSchedule(groupId: imports.UUID): Promise<any> {
		const group = await this.repository.findOne({
			where: { id: groupId },
			relations: ['course', 'lab']
		});

		if (!group) {
			throw new BadRequestException('Group not found');
		}

		// Get schedules for this group
		const schedules = await this.scheduleRepository.find({
			where: { courseGroupId: groupId },
			relations: ['assistant']
		});

		// Get course and lab information
		const course = await group.course;
		const lab = group.labId ? await group.lab : null;

		return {
			id: group.id,
			name: group.isDefault ? 'No Group' : `Group ${String.fromCharCode(64 + group.order)}`,
			order: group.order,
			capacity: group.capacity,
			isDefault: group.isDefault,
			labId: group.labId,
			labName: lab?.name,
			course: {
				id: course.id,
				name: course.name
			},
			schedules: schedules.map(schedule => ({
				weekDay: schedule.weekDay,
				startTime: schedule.startTime,
				endTime: schedule.endTime,
				assistantId: schedule.assistantId,
				assistantName: schedule.assistant ? schedule.assistant.then(a => a.name) : null
			}))
		};
	}

	/**
	 * Move student between groups with capacity validation
	 */
	async moveStudentBetweenGroups(
		studentId: imports.UUID,
		fromGroupId: imports.UUID,
		toGroupId: imports.UUID
	): Promise<{ success: boolean; message: string; warnings?: string[] }> {
		// Validate groups exist and belong to the same course
		const fromGroup = await this.repository.findOneBy({ id: fromGroupId });
		const toGroup = await this.repository.findOneBy({ id: toGroupId });

		if (!fromGroup || !toGroup) {
			throw new BadRequestException('One or both groups not found');
		}

		if (fromGroup.courseId !== toGroup.courseId) {
			throw new BadRequestException('Cannot move student between groups of different courses');
		}

		// Check if student is in the from group
		const studentCourse = await this.studentCoursesRepository.findOne({
			where: {
				studentId: studentId,
				courseId: fromGroup.courseId,
				courseGroupId: fromGroupId
			}
		});

		if (!studentCourse) {
			throw new BadRequestException('Student not found in the source group');
		}

		// Get current student count in target group
		const targetGroupStudentCount = await this.studentCoursesRepository.count({
			where: { courseGroupId: toGroupId }
		});

		// Calculate target group capacity
		const targetGroupCapacity = await this.calculateLabCapacityForCourse(toGroup.labId, toGroup.courseId);

		const warnings: string[] = [];

		// Check capacity constraints
		if (targetGroupStudentCount >= targetGroupCapacity && targetGroupCapacity > 0) {
			warnings.push(`Target group is at or over capacity (${targetGroupStudentCount}/${targetGroupCapacity}). This may cause resource conflicts.`);
		}

		if (toGroup.isDefault) {
			warnings.push('Moving student to default group. Default groups are not assigned to any lab and are meant as temporary holdings.');
		}

		// Perform the move
		await this.studentCoursesRepository.update(
			{ studentId, courseId: fromGroup.courseId },
			{ courseGroupId: toGroupId }
		);

		return {
			success: true,
			message: `Student moved successfully from ${fromGroup.isDefault ? 'No Group' : `Group ${String.fromCharCode(64 + fromGroup.order)}`} to ${toGroup.isDefault ? 'No Group' : `Group ${String.fromCharCode(64 + toGroup.order)}`}`,
			warnings: warnings.length > 0 ? warnings : undefined
		};
	}

	/**
	 * Get available groups for moving a student (all groups in the same course except current)
	 */
	async getAvailableGroupsForMove(studentId: imports.UUID, currentGroupId: imports.UUID): Promise<any[]> {
		// Get the student's course from their current group
		const currentGroup = await this.repository.findOne({
			where: { id: currentGroupId },
			relations: ['course']
		});

		if (!currentGroup) {
			throw new BadRequestException('Current group not found');
		}

		const courseId = currentGroup.courseId;

		// Get all groups in the same course except the current one
		const availableGroups = await this.repository.find({
			where: {
				courseId: courseId,
				id: Not(currentGroupId)
			},
			relations: ['lab']
		});

		// Calculate current enrollment and capacity for each group
		const groupsWithCapacity = await Promise.all(
			availableGroups.map(async (group) => {
				const currentEnrollment = await this.studentCoursesRepository.count({
					where: { courseGroupId: group.id }
				});

				const lab = await group.lab;

				return {
					id: group.id,
					name: group.isDefault ? 'Default Group' : `Group ${String.fromCharCode(64 + group.order)}`,
					labName: lab?.name || 'No Lab',
					currentEnrollment,
					capacity: group.capacity || 0,
					hasSpace: currentEnrollment < (group.capacity || 0),
					isDefault: group.isDefault
				};
			})
		);

		// Filter to only show groups with available space
		return groupsWithCapacity.filter(group => group.hasSpace || group.isDefault);
	}
}
