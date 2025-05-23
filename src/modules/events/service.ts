import { BadRequestException, Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import { Course } from 'src/database/courses/course.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { EventSchedule, ExamStatus, StudentEventSchedule } from 'src/database/events/event_schedules.entity';
import { ExamGroup } from 'src/database/events/exam-groups.entity';
import { ExamModel, ExamModelFile } from 'src/database/events/exam-models.entity';
import { Lab } from 'src/database/labs/lab.entity';
import { User } from 'src/database/users/user.entity';
import { Device } from 'src/database/devices/device.entity';
import { WebsocketService } from 'src/websockets/websocket.service';
import { ChannelType, getChannelName, WSEventType, ExamModeData, ExamAccessData } from 'src/websockets/websocket.interfaces';
import { UUID } from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FileService } from '../files/file.service';
import { MinioService } from '../files/minio.service';
import * as ExcelJS from 'exceljs';
import * as archiver from 'archiver';
import { Readable } from 'stream';
import { ExamModeStatusDto, ExamScheduleItemDto } from './dtos';
import { CourseGroupService } from '../course-groups/service';
import { ExamModelService } from '../exam-models/service';
import { StudentFileDto } from './dtos';
import { StudentFilesService } from '../students/student-files.service';

export interface GroupCalculationResult {
	totalStudents: number;
	requiredSessions: number;
	groupDistribution: {
		courseGroupId: UUID;
		courseGroupName: string;
		studentCount: number;
		recommendedSessions: number;
		maxStudentsPerSession: number;
	}[];
	labAvailability: {
		labId: UUID;
		labName: string;
		capacity: number;
		availableSlots: number;
	}[];
}

@Injectable()
export class EventService extends BaseService<imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto> {
	private readonly logger = new Logger(EventService.name);

	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
		@InjectRepository(Course) private readonly courseRepository: Repository<Course>,
		@InjectRepository(CourseGroup) private readonly courseGroupRepository: Repository<CourseGroup>,
		@InjectRepository(EventSchedule) private readonly eventScheduleRepository: Repository<EventSchedule>,
		@InjectRepository(StudentEventSchedule) private readonly studentEventScheduleRepository: Repository<StudentEventSchedule>,
		@InjectRepository(ExamGroup) private readonly examGroupRepository: Repository<ExamGroup>,
        @InjectRepository(ExamModel) private readonly examModelRepository: Repository<ExamModel>,
        @InjectRepository(ExamModelFile) private readonly examModelFileRepository: Repository<ExamModelFile>,
		@InjectRepository(Lab) private readonly labRepository: Repository<Lab>,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
		private readonly websocketService: WebsocketService,
		private readonly fileService: FileService,
        private readonly minioService: MinioService,
        private readonly courseGroupService: CourseGroupService,
        private readonly examModelService: ExamModelService,
        private readonly studentFilesService: StudentFilesService
	) {
		super(imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto, repository);
	}

	async beforeCreateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
        const course = await this.courseRepository.findOneBy({ id: dto.courseId });
        if (!course) {
            throw new BadRequestException('Invalid course id!');
		}

        // Ensure events have a startDateTime
        if (!dto.startDateTime) {
            // Default to 24 hours from now if not specified
            dto.startDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }

		return dto;
	}
	async beforeUpdateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
        if (dto.courseId) {
            const course = await this.courseRepository.findOneBy({ id: dto.courseId });
            if (!course) {
                throw new BadRequestException('Invalid course id!');
            }
		}
		return dto;
	}

	async createEvent(dto: imports.CreateDto): Promise<imports.Entity> {
		const course = await this.courseRepository.findOneBy({ id: dto.courseId });
		if (!course) {
			throw new BadRequestException('Invalid course id!');
		}

		const event = this.repository.create(dto);
		return await this.repository.save(event);
	}

	async updateEvent(id: UUID, dto: imports.UpdateDto): Promise<imports.Entity> {
		const event = await this.repository.findOneBy({ id });
		if (!event) {
			throw new NotFoundException('Event not found');
		}

		if (dto.courseId) {
			const course = await this.courseRepository.findOneBy({ id: dto.courseId });
			if (!course) {
				throw new BadRequestException('Invalid course id!');
			}
		}

		Object.assign(event, dto);
		return await this.repository.save(event);
	}

	async getEvent(id: UUID): Promise<imports.Entity> {
		const event = await this.repository.findOneBy({ id });
		if (!event) {
			throw new NotFoundException('Event not found');
		}
		return event;
	}

	async getEvents(): Promise<imports.Entity[]> {
		return await this.repository.find();
	}

	async deleteEvent(id: UUID): Promise<void> {
		const result = await this.repository.delete(id);
		if (result.affected === 0) {
			throw new NotFoundException('Event not found');
		}
	}

	/**
	 * Calculate optimal group distribution and lab requirements for an exam
	 */
	async calculateExamGroups(eventId: UUID): Promise<GroupCalculationResult> {
		const event = await this.repository.findOne({
			where: { id: eventId },
			relations: ['course'],
		});

		if (!event) {
			throw new NotFoundException('Event not found');
		}

		// Get all course groups and their student counts
		const courseGroups = await this.courseGroupRepository
			.createQueryBuilder('cg')
			.leftJoin('student_courses', 'sc', 'sc.course_group_id = cg.id')
			.addSelect('COUNT(sc.student_id)', 'studentCount')
			.where('cg.course_id = :courseId', { courseId: event.courseId })
			.groupBy('cg.id')
			.getRawAndEntities();

        // Get available labs for the course
        const availableLabs = await this.labRepository
            .createQueryBuilder('lab')
            .getMany();

		const groupDistribution = courseGroups.entities.map((group, index) => {
			const studentCount = parseInt(courseGroups.raw[index].studentCount) || 0;
            const maxCapacity = group.capacity || 30; // Use group capacity
			const recommendedSessions = Math.ceil(studentCount / maxCapacity);

			return {
				courseGroupId: group.id,
				courseGroupName: `Group ${group.order}`,
				studentCount,
				recommendedSessions,
				maxStudentsPerSession: maxCapacity,
			};
		});

		const totalStudents = groupDistribution.reduce((sum, group) => sum + group.studentCount, 0);
		const requiredSessions = groupDistribution.reduce((sum, group) => sum + group.recommendedSessions, 0);

		const labAvailability = availableLabs.map((lab) => ({
			labId: lab.id,
			labName: lab.name,
			capacity: lab.capacity || 30,
			availableSlots: lab.capacity || 30,
		}));

		return {
			totalStudents,
			requiredSessions,
			groupDistribution,
			labAvailability,
		};
	}

	/**
	 * Create exam groups and schedules based on calculation
	 */
	async createExamGroupsAndSchedules(
		eventId: UUID,
		schedules: {
			courseGroupId: UUID;
			labId?: UUID;
			dateTime: Date;
			assistantId: UUID;
			maxStudents: number;
		}[],
	): Promise<void> {
		const event = await this.repository.findOneBy({ id: eventId });
		if (!event) {
			throw new NotFoundException('Event not found');
		}

		// Create exam groups first
		for (let i = 0; i < schedules.length; i++) {
			const schedule = schedules[i];

			// Create or get exam group
			let examGroup = await this.examGroupRepository.findOne({
                where: { eventId, groupNumber: i + 1 },
			});

			if (!examGroup) {
				const courseGroup = await this.courseGroupRepository.findOneBy({ id: schedule.courseGroupId });
				if (!courseGroup) {
					throw new BadRequestException(`Invalid course group id: ${schedule.courseGroupId}`);
				}

				// Count students in this course group
				const studentCount = await this.userRepository
					.createQueryBuilder('user')
					.leftJoin('student_courses', 'sc', 'sc.student_id = user.id')
					.where('sc.course_group_id = :courseGroupId', { courseGroupId: schedule.courseGroupId })
					.getCount();

				examGroup = this.examGroupRepository.create({
                    eventId,
					groupNumber: i + 1,
					expectedStudentCount: studentCount,
				});
				await this.examGroupRepository.save(examGroup);
			}

			// Create event schedule
			const eventSchedule = this.eventScheduleRepository.create({
				eventId,
				labId: schedule.labId,
				dateTime: schedule.dateTime,
				assistantId: schedule.assistantId,
				examGroupId: examGroup.id,
				maxStudents: schedule.maxStudents,
				status: ExamStatus.SCHEDULED,
			});

			await this.eventScheduleRepository.save(eventSchedule);

			// Assign students to this schedule
			await this.assignStudentsToSchedule(eventSchedule.id, schedule.courseGroupId);
		}
	}

	/**
	 * Assign students from a course group to an event schedule
	 */
	private async assignStudentsToSchedule(eventScheduleId: UUID, courseGroupId: UUID): Promise<void> {
		const students = await this.userRepository
			.createQueryBuilder('user')
			.leftJoin('student_courses', 'sc', 'sc.student_id = user.id')
			.where('sc.course_group_id = :courseGroupId', { courseGroupId })
			.getMany();

		for (const student of students) {
			const studentSchedule = this.studentEventScheduleRepository.create({
				eventSchedule_id: eventScheduleId,
				student_id: student.id,
				isInExamMode: false,
			});
			await this.studentEventScheduleRepository.save(studentSchedule);
		}

		// Update enrolled students count
		await this.eventScheduleRepository.update({ id: eventScheduleId }, { enrolledStudents: students.length });
	}

	/**
	 * Get exam mode status for a student
	 */
	async getStudentExamModeStatus(studentId: UUID): Promise<ExamModeStatusDto> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		// Get all event schedules for today where student is enrolled
		const examSchedules = await this.eventScheduleRepository
			.createQueryBuilder('es')
			.leftJoin('student_event_schedules', 'ses', 'ses.eventSchedule_id = es.id')
			.leftJoin('events', 'e', 'e.id = es.event_id')
			.where('ses.student_id = :studentId', { studentId })
			.andWhere('es.dateTime >= :today', { today })
			.andWhere('es.dateTime < :tomorrow', { tomorrow })
            .andWhere('e.isExam = true')
            .andWhere('es.status != :status', { status: ExamStatus.ENDED })
			.select(['es.id', 'es.dateTime', 'es.status', 'e.name', 'e.examModeStartMinutes'])
			.getRawMany();

		const now = new Date();
		let isInExamMode = false;
		const examModeSchedules = [];

		for (const schedule of examSchedules) {
			const examStartTime = new Date(schedule.es_dateTime);
			const examModeStartTime = new Date(examStartTime.getTime() - schedule.e_examModeStartMinutes * 60 * 1000);

            // Consider student in exam mode if:
            // 1. During preparation period (exam mode active but exam hasn't started yet)
            // 2. During active exam (exam has started but not ended)
            const isInPreparationMode = (now >= examModeStartTime && now <= examStartTime) || schedule.es_status === ExamStatus.EXAM_MODE_ACTIVE;
            const isInActiveExam = schedule.es_status === ExamStatus.STARTED;

            const isScheduleInExamMode = isInPreparationMode || isInActiveExam;
			if (isScheduleInExamMode) {
				isInExamMode = true;
			}

			examModeSchedules.push({
				eventScheduleId: schedule.es_id,
				eventName: schedule.e_name,
				dateTime: examStartTime,
				status: schedule.es_status,
			});
		}

		const nextExam = examSchedules
			.filter((s) => new Date(s.es_dateTime) > now)
			.sort((a, b) => new Date(a.es_dateTime).getTime() - new Date(b.es_dateTime).getTime())[0];

		let examStartsIn: number | undefined;
		if (nextExam) {
			const examModeStartTime = new Date(new Date(nextExam.es_dateTime).getTime() - nextExam.e_examModeStartMinutes * 60 * 1000);
			examStartsIn = Math.max(0, Math.ceil((examModeStartTime.getTime() - now.getTime()) / (1000 * 60)));
		}

		return {
			isInExamMode,
			examStartsIn,
			examSchedules: examModeSchedules,
		};
	}

	/**
	 * Get event schedule IDs for a student to listen on WebSocket channels
	 */
	async getStudentEventScheduleIds(studentId: UUID): Promise<UUID[]> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const nextWeek = new Date(today);
		nextWeek.setDate(nextWeek.getDate() + 7);

		const schedules = await this.studentEventScheduleRepository
			.createQueryBuilder('ses')
			.leftJoin('event_schedules', 'es', 'es.id = ses.eventSchedule_id')
			.where('ses.student_id = :studentId', { studentId })
			.andWhere('es.dateTime >= :today', { today })
			.andWhere('es.dateTime < :nextWeek', { nextWeek })
			.select('ses.eventSchedule_id')
			.getRawMany();

		return schedules.map((s) => s.ses_eventSchedule_id);
	}

	/**
	 * Start exam manually (for non-auto-start exams)
	 */
	async startExam(eventScheduleId: UUID, adminId: UUID): Promise<void> {
		const schedule = await this.eventScheduleRepository.findOne({
			where: { id: eventScheduleId },
			relations: ['event'],
		});

		if (!schedule) {
			throw new NotFoundException('Event schedule not found');
		}

        const event = await schedule.event;

		if (schedule.status !== ExamStatus.SCHEDULED && schedule.status !== ExamStatus.EXAM_MODE_ACTIVE) {
			throw new BadRequestException('Exam cannot be started from current status');
		}

        // For non-auto-start exams, set the exam to start in 1 minute
        const startTime = new Date(Date.now() + 60 * 1000); // 1 minute from now

        // Update the scheduled start time and prepare for auto-start
		await this.eventScheduleRepository.update(
			{ id: eventScheduleId },
			{
                dateTime: startTime,
                status: ExamStatus.EXAM_MODE_ACTIVE, // Keep in exam mode until the countdown
			},
		);

        // Notify students that the exam will start in 1 minute
        const channel = getChannelName(ChannelType.EVENT_SCHEDULE, eventScheduleId);
        const data = {
            eventScheduleId,
            eventName: event.name,
            message: 'Exam will start in 1 minute',
            startTime: startTime.toISOString(),
            timestamp: new Date().toISOString(),
        };

        await this.websocketService.emitToChannel(channel, WSEventType.EXAM_STARTING_SOON, data);

        this.logger.log(`Exam scheduled to start in 1 minute by admin ${adminId} for schedule ${eventScheduleId}`);
	}

	/**
	 * End exam manually
	 */
	async endExam(eventScheduleId: UUID, adminId: UUID): Promise<void> {
		const schedule = await this.eventScheduleRepository.findOneBy({ id: eventScheduleId });
		if (!schedule) {
			throw new NotFoundException('Event schedule not found');
		}

		if (schedule.status !== ExamStatus.STARTED) {
			throw new BadRequestException('Exam is not currently running');
		}

		await this.eventScheduleRepository.update(
			{ id: eventScheduleId },
			{
				status: ExamStatus.ENDED,
				actualEndTime: new Date(),
			},
		);

		// Notify students via WebSocket
		await this.notifyExamEnd(eventScheduleId);

		this.logger.log(`Exam ended manually by admin ${adminId} for schedule ${eventScheduleId}`);
	}

	/**
	 * Cron job to automatically handle exam mode and auto-start
	 */
	@Cron(CronExpression.EVERY_MINUTE)
	async handleAutomaticExamOperations(): Promise<void> {
		const now = new Date();
        this.logger.debug(`🕐 Running automatic exam operations at ${now.toLocaleTimeString()}`);

        try {
            // Handle exam mode activation (30 minutes before exam)
            await this.activateExamMode(now);

            // Handle auto-start exams
            await this.autoStartExams(now);

            // Handle auto-end exams
            await this.autoEndExams(now);
        } catch (error) {
            this.logger.error('Error in automatic exam operations:', error);
        }
	}

	private async activateExamMode(now: Date): Promise<void> {
		const schedules = await this.eventScheduleRepository
			.createQueryBuilder('es')
			.leftJoin('events', 'e', 'e.id = es.event_id')
			.where('es.status = :status', { status: ExamStatus.SCHEDULED })
            .andWhere('e.isExam = true')
			.andWhere('es.dateTime > :now', { now })
			.andWhere('es.dateTime <= :examModeTime', {
				examModeTime: new Date(now.getTime() + 35 * 60 * 1000), // 35 minutes buffer
			})
			.select(['es.id', 'es.dateTime', 'e.examModeStartMinutes', 'e.name'])
			.getRawMany();

        let activatedCount = 0;
		for (const schedule of schedules) {
			const examStartTime = new Date(schedule.es_dateTime);
			const examModeStartTime = new Date(examStartTime.getTime() - schedule.e_examModeStartMinutes * 60 * 1000);

			if (now >= examModeStartTime && now < examStartTime) {
				await this.eventScheduleRepository.update(
					{ id: schedule.es_id },
					{
						status: ExamStatus.EXAM_MODE_ACTIVE,
						examModeStartTime: now,
					},
				);

				await this.notifyExamModeStart(schedule.es_id, schedule.e_name);

				// Send exam mode status updates to all students in this exam
				await this.notifyStudentsExamModeChange(schedule.es_id);

                this.logger.log(`⏰ Exam mode activated: "${schedule.e_name}" (schedule ${schedule.es_id}) at ${now.toLocaleTimeString()}`);
                activatedCount++;
			}
		}

        if (activatedCount > 0) {
            this.logger.log(`⏰ Activated exam mode for ${activatedCount} exam(s)`);
        }
	}

	private async autoStartExams(now: Date): Promise<void> {
		const schedules = await this.eventScheduleRepository
			.createQueryBuilder('es')
			.leftJoin('events', 'e', 'e.id = es.event_id')
            .where('es.status IN (:...statuses)', { statuses: [ExamStatus.EXAM_MODE_ACTIVE, ExamStatus.SCHEDULED] })
            .andWhere('es.autoStart = true')
			.andWhere('es.dateTime <= :now', { now })
            .andWhere('DATE_ADD(es.dateTime, INTERVAL e.duration MINUTE) > :now', { now })
            .select(['es.id', 'e.name', 'es.dateTime', 'e.id as eventId', 'e.requiresModels'])
			.getRawMany();

        if (schedules.length > 0) {
            this.logger.log(`🚀 Found ${schedules.length} exam(s) ready to auto-start`);
        }

        for (const schedule of schedules) {
            // If exam requires models, assign them to students
            if (schedule.e_requiresModels) {
                const studentSchedules = await this.studentEventScheduleRepository.find({
                    where: {
                        eventSchedule: { id: schedule.es_id }
                    },
                    relations: ['student']
                });

                for (const studentSchedule of studentSchedules) {
                    try {
                        await this.examModelService.assignRandomExamModelToStudent(
                            schedule.e_eventId,
                            studentSchedule.student_id
                        );
                    } catch (error) {
                        this.logger.error(`Failed to assign exam model to student ${studentSchedule.student_id}: ${error.message}`);
                    }
                }
            }

            await this.eventScheduleRepository.update(
                { id: schedule.es_id },
                {
                    status: ExamStatus.STARTED,
                    actualStartTime: now,
                },
            );
            await this.notifyExamStart(schedule.es_id, schedule.e_name);
            // Send exam mode status updates to all students in this exam
            await this.notifyStudentsExamModeChange(schedule.es_id);

            this.logger.log(`🚀 Exam auto-started: "${schedule.e_name}" (schedule ${schedule.es_id}) at ${now.toLocaleTimeString()}`);
		}
	}

	private async autoEndExams(now: Date): Promise<void> {
		const schedules = await this.eventScheduleRepository
			.createQueryBuilder('es')
			.leftJoin('events', 'e', 'e.id = es.event_id')
			.where('es.status = :status', { status: ExamStatus.STARTED })
			.andWhere('es.actualStartTime IS NOT NULL')
			.select(['es.id', 'es.actualStartTime', 'e.duration', 'e.name'])
			.getRawMany();

        let endedCount = 0;
		for (const schedule of schedules) {
			const examEndTime = new Date(schedule.es_actualStartTime.getTime() + schedule.e_duration * 60 * 1000);

			if (now >= examEndTime) {
				await this.eventScheduleRepository.update(
					{ id: schedule.es_id },
					{
						status: ExamStatus.ENDED,
						actualEndTime: now,
					},
				);

				await this.notifyExamEnd(schedule.es_id);

				// Send exam mode status updates to all students in this exam
				await this.notifyStudentsExamModeChange(schedule.es_id);

                this.logger.log(`✅ Exam auto-ended: "${schedule.e_name}" (schedule ${schedule.es_id}) at ${now.toLocaleTimeString()}`);
                endedCount++;
			}
		}

        if (endedCount > 0) {
            this.logger.log(`✅ Auto-ended ${endedCount} exam(s)`);
        }
	}

	/**
	 * Notify all students in an exam schedule about exam mode status changes
	 */
	private async notifyStudentsExamModeChange(eventScheduleId: UUID): Promise<void> {
		try {
			// Get all students enrolled in this exam schedule
			const studentSchedules = await this.studentEventScheduleRepository.find({
				where: { eventSchedule_id: eventScheduleId },
				select: ['student_id']
			});

			// Send updated exam mode status to each student
			for (const studentSchedule of studentSchedules) {
				try {
					const examModeStatus = await this.getStudentExamModeStatus(studentSchedule.student_id);
					this.websocketService.notifyExamModeStatusChange(studentSchedule.student_id, examModeStatus);
				} catch (error) {
					this.logger.warn(`Failed to send exam mode status to student ${studentSchedule.student_id}:`, error.message);
				}
			}

			this.logger.debug(`Sent exam mode status updates to ${studentSchedules.length} students for schedule ${eventScheduleId}`);
		} catch (error) {
			this.logger.error(`Failed to notify students of exam mode change for schedule ${eventScheduleId}:`, error.message);
		}
	}

	private async notifyExamModeStart(eventScheduleId: UUID, eventName: string): Promise<void> {
		const channel = getChannelName(ChannelType.EVENT_SCHEDULE, eventScheduleId);
		const data: ExamModeData = {
			eventScheduleId,
			eventName,
			status: 'exam_mode_start',
			timestamp: new Date().toISOString(),
		};

		await this.websocketService.emitToChannel(channel, WSEventType.EXAM_MODE_START, data);
	}

	private async notifyExamStart(eventScheduleId: UUID, eventName: string): Promise<void> {
		const channel = getChannelName(ChannelType.EVENT_SCHEDULE, eventScheduleId);
		const schedule = await this.eventScheduleRepository.findOneBy({ id: eventScheduleId });

		const data: ExamAccessData = {
			eventScheduleId,
			eventName,
			examFiles: schedule?.examFiles,
			canAccess: true,
			timestamp: new Date().toISOString(),
		};

		await this.websocketService.emitToChannel(channel, WSEventType.EXAM_ACCESS_GRANTED, data);
	}

	private async notifyExamEnd(eventScheduleId: UUID): Promise<void> {
		const channel = getChannelName(ChannelType.EVENT_SCHEDULE, eventScheduleId);
		const data: ExamModeData = {
			eventScheduleId,
			eventName: '',
			status: 'exam_end',
			timestamp: new Date().toISOString(),
		};

		await this.websocketService.emitToChannel(channel, WSEventType.EXAM_END, data);
	}

	/**
	 * Submit files for a student
	 */
	async submitStudentFiles(
		studentId: UUID,
		eventScheduleId: UUID,
		files: Express.Multer.File[]
	): Promise<{ message: string; submittedFiles: string[]; submittedAt: Date }> {
		// Verify student is enrolled in this exam schedule
		const studentSchedule = await this.studentEventScheduleRepository.findOne({
			where: {
				student_id: studentId,
				eventSchedule_id: eventScheduleId
			},
            relations: ['eventSchedule', 'eventSchedule.event', 'eventSchedule.event.course']
		});

		if (!studentSchedule) {
			throw new NotFoundException('Student not enrolled in this exam');
		}

		// Check if exam is in progress or ended (allow submissions during exam)
		const schedule = await studentSchedule.eventSchedule;
		const event = await schedule.event;
        const course = await event.course;

		if (schedule.status !== ExamStatus.STARTED && schedule.status !== ExamStatus.ENDED) {
			throw new BadRequestException('Exam is not active for file submissions');
		}

        // Upload files and create student file records
        const uploadedFiles: string[] = [];
        const submittedAt = new Date();
        for (const file of files) {
            const studentFile = await this.studentFilesService.uploadExamFile(
                studentId,
                course.id,
                event.id,
                file
            );
            const fileRecord = await studentFile.file;
            uploadedFiles.push(fileRecord.objectName);
        }

		this.logger.log(`Student ${studentId} submitted ${files.length} files for exam ${eventScheduleId}`);

		return {
			message: 'Files submitted successfully',
			submittedFiles: uploadedFiles,
			submittedAt: submittedAt
		};
	}

	/**
	 * Upload multiple exam models for an event schedule
	 */
	async uploadExamModels(
		eventScheduleId: UUID,
		examModelFiles: Express.Multer.File[]
	): Promise<{ message: string; uploadedModels: string[] }> {
		const schedule = await this.eventScheduleRepository.findOneBy({ id: eventScheduleId });
		if (!schedule) {
			throw new NotFoundException('Event schedule not found');
		}

		// Upload exam model files
		const uploadedModels: string[] = [];
		for (const file of examModelFiles) {
			const uploadResult = await this.fileService.uploadFile(file, {
				prefix: `exam-models/${eventScheduleId}`,
				isPublic: false
			});
			uploadedModels.push(uploadResult.url || uploadResult.objectName);
		}

		// Update event schedule with exam models
		await this.eventScheduleRepository.update(
			{ id: eventScheduleId },
			{ examModels: JSON.stringify(uploadedModels) }
		);

		// Assign random exam models to students
		await this.assignRandomExamModels(eventScheduleId, uploadedModels);

		this.logger.log(`Uploaded ${examModelFiles.length} exam models for schedule ${eventScheduleId}`);

		return {
			message: 'Exam models uploaded and assigned successfully',
			uploadedModels: uploadedModels
		};
	}

	/**
	 * Assign exam models to students based on event groups
	 * Admin assigns models for each group, and each student gets a random model from their group
	 */
	private async assignRandomExamModels(eventScheduleId: UUID, examModels: string[]): Promise<void> {
        if (examModels.length === 0) {
            this.logger.warn(`No exam models to assign for schedule ${eventScheduleId}`);
            return;
        }

        // Get the event schedule and its associated exam group
        const schedule = await this.eventScheduleRepository.findOne({
            where: { id: eventScheduleId },
            relations: ['examGroup']
        });

        if (!schedule) {
            throw new NotFoundException('Event schedule not found');
        }

        // Get all student schedules for this event schedule
		const studentSchedules = await this.studentEventScheduleRepository.find({
			where: { eventSchedule_id: eventScheduleId }
		});

        if (studentSchedules.length === 0) {
            this.logger.warn(`No students enrolled in schedule ${eventScheduleId}`);
            return;
        }

        // For each student in the group, assign a random model from the available models
        // This allows each student to get a different model even within the same group
		for (const studentSchedule of studentSchedules) {
            // Assign a random model to each student
            const randomModelIndex = Math.floor(Math.random() * examModels.length);
            const assignedModel = examModels[randomModelIndex];

			await this.studentEventScheduleRepository.update(
				{
					student_id: studentSchedule.student_id,
					eventSchedule_id: eventScheduleId
				},
                {
                    assignedExamModelUrl: assignedModel,
                    examModel: `Model ${randomModelIndex + 1}` // Human-readable model name
                }
			);
		}

        this.logger.log(`Assigned random exam models to ${studentSchedules.length} students in schedule ${eventScheduleId}`);
	}

	/**
	 * Download all student submissions for an event as a ZIP file
	 */
    async downloadAllSubmissions(eventScheduleId: UUID): Promise<{ buffer: Buffer; filename: string; excelBuffer: Buffer }> {
        this.logger.debug(`Starting downloadAllSubmissions for eventScheduleId: ${eventScheduleId}`);

		const schedule = await this.eventScheduleRepository.findOne({
			where: { id: eventScheduleId },
			relations: ['event']
		});

		if (!schedule) {
            this.logger.error(`Event schedule not found for id: ${eventScheduleId}`);
			throw new NotFoundException('Event schedule not found');
		}

		const event = await schedule.event;
        this.logger.debug(`Found event: ${event.name} (id: ${event.id})`);

        // Get all student enrollments for this event schedule
		const studentSchedules = await this.studentEventScheduleRepository
			.createQueryBuilder('ses')
			.leftJoinAndSelect('ses.student', 'user')
			.leftJoin('students', 'student', 'student.id = user.id')
			.addSelect(['student.seatNo'])
			.where('ses.eventSchedule_id = :scheduleId', { scheduleId: eventScheduleId })
            .orderBy('student.seatNo', 'ASC')
            .addOrderBy('user.name', 'ASC')
			.getMany();

        this.logger.debug(`Found ${studentSchedules.length} student schedules`);

        // Try to use RAR if available, otherwise fallback to tar.gz
        const useRar = process.env.USE_RAR_FORMAT === 'true';

        if (useRar) {
            return this.createRarArchive(event, studentSchedules);
        } else {
            return this.createTarGzArchive(event, studentSchedules);
        }
    }

    private async createRarArchive(event: any, studentSchedules: any[]): Promise<{ buffer: Buffer; filename: string; excelBuffer: Buffer }> {
        const fs = require('fs');
        const path = require('path');
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        // Create temporary directory
        const tempDir = path.join(process.cwd(), 'temp', `submissions_${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });

        try {
            // Create Excel sheet for marks
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Student Marks');
            this.logger.debug('Created Excel workbook and worksheet');

            // Add headers
            worksheet.columns = [
                { header: 'Student Name', key: 'studentName', width: 25 },
                { header: 'Seat No', key: 'seatNo', width: 15 },
                { header: 'Mark', key: 'mark', width: 10 },
                { header: 'Status', key: 'status', width: 15 }
            ];

            // Process each student
            for (const studentSchedule of studentSchedules) {
                const user = await studentSchedule.student;
                const studentName = user.name;
                const seatNoDisplay = studentSchedule.seatNo || 'N/A';

                this.logger.debug(`Processing student: ${studentName} (seat: ${seatNoDisplay})`);

                // Get actual submitted files from the database
                const submittedFiles = await this.studentFilesService.getStudentExamFiles(user.id, event.id);
                const hasSubmissions = submittedFiles.length > 0;

                this.logger.debug(`Student ${studentName} has ${submittedFiles.length} submitted files`);

                // Determine status based on submissions
                const status = hasSubmissions ? 'Present' : 'Absent';

                // Add to Excel sheet with conditional formatting for absent students
                const row = worksheet.addRow({
                    studentName: studentName,
                    seatNo: seatNoDisplay,
                    mark: studentSchedule.mark || '',
                    status: status
                });

                // Highlight absent students in yellow
                if (!hasSubmissions) {
                    row.eachCell((cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFFF00' } // Yellow background
                        };
                    });
                    this.logger.debug(`Marked student ${studentName} as absent (highlighted in yellow)`);
                }

                // Create folder for student
                const studentFolder = path.join(tempDir, `${seatNoDisplay} - ${studentName}`);
                fs.mkdirSync(studentFolder, { recursive: true });

                if (hasSubmissions) {
                    // Add actual submitted files to student folder
                    for (let i = 0; i < submittedFiles.length; i++) {
                        const studentFile = submittedFiles[i];
                        const fileRecord = await studentFile.file;

                        this.logger.debug(`Processing file ${i + 1}/${submittedFiles.length}: ${fileRecord.originalname} for student ${studentName}`);

                        try {
                            // Get presigned URL for the file
                            const presignedUrl = await this.minioService.getPresignedUrl(fileRecord.objectName, 3600);
                            this.logger.debug(`Generated presigned URL for file: ${fileRecord.originalname}`);

                            // Create a reference file with the download URL
                            const fileReference = `File: ${fileRecord.originalname}\nDownload URL: ${presignedUrl}\nFile Size: ${fileRecord.size} bytes\nSubmitted At: ${studentFile.date}`;

                            fs.writeFileSync(
                                path.join(studentFolder, `${fileRecord.originalname}_download_link.txt`),
                                fileReference
                            );

                            this.logger.debug(`Added file reference: ${fileRecord.originalname}_download_link.txt`);
                        } catch (error) {
                            this.logger.error(`Failed to process file ${fileRecord.originalname} for student ${studentName}: ${error.message}`);
                            // Add error placeholder
                            fs.writeFileSync(
                                path.join(studentFolder, `ERROR_${fileRecord.originalname}.txt`),
                                `Error: Could not process file ${fileRecord.originalname}`
                            );
                        }
                    }
                } else {
                    // If no files submitted, add placeholder
                    fs.writeFileSync(
                        path.join(studentFolder, 'no_submission.txt'),
                        'No files submitted by this student'
                    );
                    this.logger.debug(`Added no submission placeholder for student: ${studentName}`);
                }
            }

            this.logger.debug('Finished processing all students, generating Excel buffer');

            // Generate Excel buffer and save to temp directory
            const excelBuffer = await workbook.xlsx.writeBuffer() as Buffer;
            fs.writeFileSync(path.join(tempDir, 'student_marks_template.xlsx'), excelBuffer);
            this.logger.debug(`Generated Excel buffer of size: ${excelBuffer.length} bytes`);

            // Create RAR archive using WinRAR command line
            const filename = `${event.name}_submissions_${new Date().toISOString().split('T')[0]}.rar`;
            const rarPath = path.join(tempDir, filename);

            // Try to create RAR archive (requires WinRAR to be installed)
            try {
                await execAsync(`"C:\\Program Files\\WinRAR\\WinRAR.exe" a -ep1 "${rarPath}" "${tempDir}\\*"`);
                this.logger.debug(`RAR archive created successfully: ${filename}`);
            } catch (error) {
                this.logger.warn(`WinRAR not found, falling back to tar.gz: ${error.message}`);
                // Cleanup temp directory
                fs.rmSync(tempDir, { recursive: true, force: true });
                return this.createTarGzArchive(event, studentSchedules);
            }

            // Read the RAR file as buffer
            const buffer = fs.readFileSync(rarPath);
            this.logger.debug(`RAR archive completed. Buffer size: ${buffer.length} bytes, filename: ${filename}`);

            // Cleanup temp directory
            fs.rmSync(tempDir, { recursive: true, force: true });

            return {
                buffer: buffer,
                filename: filename,
                excelBuffer: excelBuffer
            };
        } catch (error) {
            // Cleanup temp directory on error
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
            throw error;
        }
    }

    private async createTarGzArchive(event: any, studentSchedules: any[]): Promise<{ buffer: Buffer; filename: string; excelBuffer: Buffer }> {
        // Create tar.gz archive for better binary integrity
        const archive = archiver('tar', {
            gzip: true,
            gzipOptions: {
                level: 9,
                memLevel: 9
            }
        });
        const buffers: Buffer[] = [];

        // Create Excel sheet for marks
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Student Marks');
        this.logger.debug('Created Excel workbook and worksheet');

        // Add headers
        worksheet.columns = [
            { header: 'Student Name', key: 'studentName', width: 25 },
            { header: 'Seat No', key: 'seatNo', width: 15 },
            { header: 'Mark', key: 'mark', width: 10 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        // Process each student
        for (const studentSchedule of studentSchedules) {
            const user = await studentSchedule.student;
            const studentName = user.name;
            const seatNoDisplay = studentSchedule.seatNo || 'N/A';

            this.logger.debug(`Processing student: ${studentName} (seat: ${seatNoDisplay})`);

            // Get actual submitted files from the database
            const submittedFiles = await this.studentFilesService.getStudentExamFiles(user.id, event.id);
            const hasSubmissions = submittedFiles.length > 0;

            this.logger.debug(`Student ${studentName} has ${submittedFiles.length} submitted files`);

            // Determine status based on submissions
            const status = hasSubmissions ? 'Present' : 'Absent';

            // Add to Excel sheet with conditional formatting for absent students
            const row = worksheet.addRow({
                studentName: studentName,
                seatNo: seatNoDisplay,
                mark: studentSchedule.mark || '',
                status: status
            });

            // Highlight absent students in yellow
            if (!hasSubmissions) {
                row.eachCell((cell) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFFF00' } // Yellow background
                    };
                });
                this.logger.debug(`Marked student ${studentName} as absent (highlighted in yellow)`);
            }

            // Create folder for student using seatNo - fullName format
            const studentFolder = `${seatNoDisplay} - ${studentName}/`;
            this.logger.debug(`Created student folder: ${studentFolder}`);

            if (hasSubmissions) {
            // Add actual submitted files to student folder
				for (let i = 0; i < submittedFiles.length; i++) {
                    const studentFile = submittedFiles[i];
                    const fileRecord = await studentFile.file;

                    this.logger.debug(`Processing file ${i + 1}/${submittedFiles.length}: ${fileRecord.originalname} for student ${studentName}`);

                    try {
                        // Get presigned URL for the file
                        const presignedUrl = await this.minioService.getPresignedUrl(fileRecord.objectName, 3600);
                        this.logger.debug(`Generated presigned URL for file: ${fileRecord.originalname}`);

                        // Create a reference file with the download URL
                        const fileReference = `File: ${fileRecord.originalname}\nDownload URL: ${presignedUrl}\nFile Size: ${fileRecord.size} bytes\nSubmitted At: ${studentFile.date}`;

                        archive.append(fileReference, {
                            name: `${studentFolder}${fileRecord.originalname}_download_link.txt`
                        });

                        this.logger.debug(`Added file reference to archive: ${fileRecord.originalname}_download_link.txt`);
                    } catch (error) {
                        this.logger.error(`Failed to process file ${fileRecord.originalname} for student ${studentName}: ${error.message}`);
                        // Add error placeholder
                        archive.append(`Error: Could not process file ${fileRecord.originalname}`, {
                            name: `${studentFolder}ERROR_${fileRecord.originalname}.txt`
                        });
                    }
                }
            } else {
                // If no files submitted, add placeholder
                archive.append('No files submitted by this student', {
					name: `${studentFolder}no_submission.txt`
				});
                this.logger.debug(`Added no submission placeholder for student: ${studentName}`);
			}
		}

        this.logger.debug('Finished processing all students, generating Excel buffer');

		// Generate Excel buffer
		const excelBuffer = await workbook.xlsx.writeBuffer() as Buffer;
        this.logger.debug(`Generated Excel buffer of size: ${excelBuffer.length} bytes`);

        // Add Excel sheet to archive
		archive.append(excelBuffer, { name: 'student_marks_template.xlsx' });
        this.logger.debug('Added Excel sheet to tar.gz archive');

        // Return Promise that properly handles archive events with timeout
        const archivePromise = new Promise<{ buffer: Buffer; filename: string; excelBuffer: Buffer }>((resolve, reject) => {
            // Set up event handlers first
            archive.on('data', (chunk: Buffer) => {
                buffers.push(chunk);
            });

			archive.on('end', () => {
                const archiveBuffer = Buffer.concat(buffers);
                const filename = `${event.name}_submissions_${new Date().toISOString().split('T')[0]}.tar.gz`;

                this.logger.debug(`tar.gz archive completed. Buffer size: ${archiveBuffer.length} bytes, filename: ${filename}`);

				resolve({
                    buffer: archiveBuffer,
                    filename: filename,
					excelBuffer: excelBuffer
				});
			});

            archive.on('error', (error) => {
                this.logger.error(`Error creating tar.gz archive: ${error.message}`, error.stack);
                reject(error);
            });

            archive.on('warning', (warning) => {
                this.logger.warn(`tar.gz archive warning: ${warning.message}`);
            });

            // Finalize archive after setting up event handlers
            this.logger.debug('Finalizing tar.gz archive');
            archive.finalize().catch((error) => {
                this.logger.error(`Error finalizing tar.gz archive: ${error.message}`, error.stack);
                reject(error);
            });
        });

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error('Archive creation timeout after 5 minutes'));
            }, 5 * 60 * 1000); // 5 minutes timeout
		});

        return Promise.race([archivePromise, timeoutPromise]);
	}

	/**
	 * Upload marks from Excel file
	 */
	async uploadMarksFromExcel(
		eventScheduleId: UUID,
		marksFile: Express.Multer.File
	): Promise<{ message: string; processedStudents: number; errors: string[] }> {
		const schedule = await this.eventScheduleRepository.findOneBy({ id: eventScheduleId });
		if (!schedule) {
			throw new NotFoundException('Event schedule not found');
		}

		// Parse Excel file
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(marksFile.buffer);
		const worksheet = workbook.getWorksheet(1);

		if (!worksheet) {
			throw new BadRequestException('Invalid Excel file - no worksheet found');
		}

		const errors: string[] = [];
		let processedStudents = 0;

		// Process rows (skip header)
		for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
			const row = worksheet.getRow(rowNum);
			const studentName = row.getCell(1).value?.toString()?.trim();
			const seatNo = row.getCell(2).value?.toString()?.trim();
			const mark = parseFloat(row.getCell(3).value?.toString() || '0');

			if (!studentName || !seatNo) {
				continue; // Skip empty rows
			}

			try {
				// Find student by name and seat number
				const studentSchedule = await this.studentEventScheduleRepository
					.createQueryBuilder('ses')
					.leftJoinAndSelect('ses.student', 'user')
					.leftJoin('students', 'student', 'student.id = user.id')
					.addSelect(['student.seatNo'])
					.where('ses.eventSchedule_id = :scheduleId', { scheduleId: eventScheduleId })
					.andWhere('user.name = :studentName', { studentName })
					.andWhere('(ses.seatNo = :seatNo OR student.seatNo = :seatNoInt)', {
						seatNo,
						seatNoInt: parseInt(seatNo) || null
					})
					.getOne();

				if (!studentSchedule) {
					errors.push(`Student not found: ${studentName} (Seat: ${seatNo})`);
					continue;
				}

				// Update mark
				await this.studentEventScheduleRepository.update(
					{
						student_id: studentSchedule.student_id,
						eventSchedule_id: eventScheduleId
					},
					{ mark: mark }
				);

				processedStudents++;
			} catch (error) {
				errors.push(`Error processing ${studentName}: ${error.message}`);
			}
		}

		this.logger.log(`Processed marks for ${processedStudents} students with ${errors.length} errors`);

		return {
			message: `Successfully processed marks for ${processedStudents} students`,
			processedStudents,
			errors
		};
	}

    async getCourseEvents(courseId: UUID): Promise<imports.GetListDto[]> {
        // Validate course exists
        const course = await this.courseRepository.findOneBy({ id: courseId });
        if (!course) {
            throw new NotFoundException('Course not found!');
        }

        // Get all events for this course
        const events = await this.repository
            .createQueryBuilder('event')
            .where('event.courseId = :courseId', { courseId })
            .orderBy('event.created_at', 'DESC')
            .getMany();

        // Transform events to include additional data
        const eventListDtos = await Promise.all(
            events.map(async (event) => {
                // Count how many groups are assigned to this event
                const eventGroupsCount = await this.examGroupRepository.count({
                    where: { eventId: event.id }
                });

                // Get event schedules to calculate additional info
                const schedules = await this.eventScheduleRepository.find({
                    where: { eventId: event.id }
                });

                return {
                    ...event,
                    eventGroups: eventGroupsCount,
                    totalSchedules: schedules.length,
                    hasSchedules: schedules.length > 0,
                    courseCode: `${course.subjectCode}${course.courseNumber}`,
                    courseName: course.name,
                };
            })
        );

        return eventListDtos as imports.GetListDto[];
    }

    async getStudentExams(studentId: UUID): Promise<any[]> {
        // Query to get the raw data
        const rawResults = await this.studentEventScheduleRepository
            .createQueryBuilder('ses')
            .leftJoin('event_schedules', 'es', 'es.id = ses.eventSchedule_id')
            .leftJoin('events', 'event', 'event.id = es.event_id')
            .leftJoin('courses', 'course', 'course.id = event.courseId')
            .leftJoin('labs', 'lab', 'lab.id = es.lab_id')
            .select([
                'ses.eventSchedule_id AS scheduleId',
                'ses.student_id AS studentId',
                'ses.submittedFiles AS submittedFiles',
                'ses.submittedAt AS submittedAt',
                'ses.mark AS mark',
                'es.dateTime AS dateTime',
                'es.examFiles AS examFiles',
                'es.status AS status',
                'es.examGroupId AS examGroupId',
                'event.id AS eventId',
                'event.name AS eventName',
                'event.duration AS duration',
                'event.examModeStartMinutes AS examModeStartMinutes',
                'course.name AS courseName',
                'course.subjectCode AS subjectCode',
                'course.courseNumber AS courseNumber',
                'lab.name AS labName'
            ])
            .where('ses.student_id = :studentId', { studentId })
            .andWhere('event.eventType = :eventType', { eventType: imports.EventType.EXAM })
            .orderBy('es.dateTime', 'ASC')
            .getRawMany();

        // Transform to student exam DTOs
        return rawResults.map((result) => {
            const now = new Date();
            const examDate = new Date(result.dateTime);
            const examModeStart = new Date(examDate.getTime() - (result.examModeStartMinutes || 30) * 60 * 1000);

            // Determine status
            let status = 'upcoming';
            let hasAccess = false;
            let canSubmit = false;

            if (result.status === 'ended') {
                status = 'completed';
            } else if (result.status === 'started') {
                status = 'in_progress';
                hasAccess = true;
                canSubmit = true;
            } else if (result.status === 'exam_mode_active') {
                status = 'exam_mode';
                hasAccess = true;
            } else if (now >= examModeStart && now < examDate) {
                status = 'exam_mode';
                hasAccess = true;
            } else if (now >= examDate) {
                status = 'in_progress';
                hasAccess = true;
                canSubmit = true;
            }

            return {
                id: result.eventId,
                name: result.eventName,
                courseName: result.courseName,
                courseCode: `${result.subjectCode}${result.courseNumber}`,
                dateTime: result.dateTime,
                duration: result.duration,
                location: result.labName || 'Online',
                status,
                hasAccess,
                examFiles: result.examFiles ? result.examFiles.split(',') : [],
                groupId: result.examGroupId,
                scheduleId: result.scheduleId,
                submittedFiles: result.submittedFiles ? result.submittedFiles.split(',') : [],
                canSubmit,
            };
        });
    }

    async exportCourseEventsToExcel(courseId: UUID): Promise<ExcelJS.Workbook> {
        // Get course events
        const events = await this.getCourseEvents(courseId);

        // Create workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Course Events');

        // Define columns
        worksheet.columns = [
            { header: 'Event Name', key: 'name', width: 30 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Location', key: 'location', width: 15 },
            { header: 'Duration (min)', key: 'duration', width: 15 },
            { header: 'Marks', key: 'degree', width: 10 },
            { header: 'Groups', key: 'eventGroups', width: 10 },
            { header: 'Auto Start', key: 'autoStart', width: 12 },
            { header: 'Exam Mode Start (min)', key: 'examModeStartMinutes', width: 20 }
        ];

        // Add header row styling
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Add data rows
        events.forEach((event: any) => {
            worksheet.addRow({
                name: event.name,
                type: event.eventType === imports.EventType.EXAM ? 'Exam' : 'Assignment',
                location: 'In Lab',
                duration: event.duration,
                degree: event.degree || 0,
                eventGroups: event.eventGroups || 0,
                autoStart: event.autoStart ? 'Yes' : 'No',
                examModeStartMinutes: event.examModeStartMinutes || 0
            });
        });

        // Auto-fit columns
        worksheet.columns.forEach(column => {
            column.width = Math.max(column.width || 10, 15);
        });

        return workbook;
    }

    /**
     * Calculate lab capacity for a specific course based on software requirements
     * Delegates to CourseGroupService for consistent calculation logic
     */
    private async calculateLabCapacityForCourse(labId: UUID, courseId: UUID): Promise<number> {
        return this.courseGroupService.calculateLabCapacityForCourse(labId, courseId);
    }

    /**
     * Simulate group creation for event scheduling - starts with no groups, admin adds groups by selecting labs
     */
    async simulateGroupCreation(courseId: UUID): Promise<imports.GroupCreationSimulationDto> {
        // Get all students enrolled in the course
        const totalStudentsQuery = await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('student_courses', 'sc', 'sc.student_id = user.id')
            .where('sc.course_id = :courseId', { courseId })
            .getCount();

        // Start with no proposed groups - admin will add them
        const proposedGroups: imports.ProposedGroupDto[] = [];

        // Get course to understand software requirements
        const course = await this.courseRepository.findOneBy({ id: courseId });
        if (!course) {
            throw new BadRequestException('Course not found');
        }

        const courseSoftwares = await course.softwares;
        const requiredSoftware = courseSoftwares.map((software) => software.name);

        // Get available labs for selection with proper capacity calculation
        const labs = await this.labRepository.find({ relations: ['devices', 'devices.deviceSoftwares'] });
        const availableLabs: imports.LabAvailabilityDto[] = await Promise.all(
            labs.map(async (lab) => {
                // Use the abstracted capacity calculation from CourseGroupService
                const effectiveCapacity = await this.calculateLabCapacityForCourse(lab.id, courseId);

                return {
                    labId: lab.id,
                    labName: lab.name,
                    totalCapacity: effectiveCapacity, // Use effective capacity based on software requirements
                    availableCapacity: effectiveCapacity, // Full effective capacity available initially
                    requiredSoftware: requiredSoftware,
                    hasRequiredSoftware: effectiveCapacity > 0
                };
            })
        );

        // All students are uncovered initially since no groups exist
        const uncoveredStudents = totalStudentsQuery;

        return {
            totalStudents: totalStudentsQuery,
            requiredGroups: 0, // No groups initially
            proposedGroups,
            uncoveredStudents,
            canCreateEvent: false, // Cannot create event until all students are covered
            availableLabs
        };
    }

    /**
     * Add a group to the simulation by selecting a lab
     */
    async addGroupToSimulation(courseId: UUID, labId: UUID, proposedCapacity?: number): Promise<imports.GroupCreationSimulationDto> {
        // Get current simulation state
        const simulation = await this.simulateGroupCreation(courseId);

        // Find the selected lab
        const selectedLab = simulation.availableLabs.find(lab => lab.labId === labId);
        if (!selectedLab) {
            throw new BadRequestException('Lab not found');
        }

        // If no capacity specified, use lab's effective capacity
        const defaultCapacity = selectedLab.totalCapacity;
        const actualProposedCapacity = proposedCapacity ?? defaultCapacity;

        // Calculate total already covered students from existing proposed groups
        const alreadyCoveredStudents = simulation.proposedGroups.reduce((sum, group) => sum + group.proposedCapacity, 0);

        // Determine students to be covered by this new group
        const remainingStudents = simulation.totalStudents - alreadyCoveredStudents;
        const actualCapacityForGroup = Math.min(actualProposedCapacity, remainingStudents);

        // Create new group
        const newGroup: imports.ProposedGroupDto = {
            courseGroupId: `temp-${Date.now()}`, // Temporary ID for simulation
            courseGroupName: `Group ${simulation.proposedGroups.length + 1}`,
            currentStudentCount: actualCapacityForGroup,
            maxCapacity: selectedLab.totalCapacity,
            selectedLabId: labId,
            selectedLabName: selectedLab.labName,
            proposedCapacity: actualCapacityForGroup,
            hasSchedule: false,
            scheduleDateTime: undefined,
            isOverCapacity: actualProposedCapacity > selectedLab.totalCapacity
        };

        // Add the new group to proposed groups
        const updatedProposedGroups = [...simulation.proposedGroups, newGroup];

        // Update uncovered students
        const totalCoveredStudents = updatedProposedGroups.reduce((sum, group) => sum + group.proposedCapacity, 0);
        const uncoveredStudents = Math.max(0, simulation.totalStudents - totalCoveredStudents);

        // Note: We don't reduce lab availability since multiple groups can use the same lab at different times

        return {
            totalStudents: simulation.totalStudents,
            requiredGroups: updatedProposedGroups.length,
            proposedGroups: updatedProposedGroups,
            uncoveredStudents,
            canCreateEvent: uncoveredStudents === 0,
            availableLabs: simulation.availableLabs // Keep original lab availability
        };
    }

    /**
     * Remove a group from the simulation
     */
    async removeGroupFromSimulation(courseId: UUID, groupIndex: number): Promise<imports.GroupCreationSimulationDto> {
        // Get current simulation state
        const simulation = await this.simulateGroupCreation(courseId);

        if (groupIndex < 0 || groupIndex >= simulation.proposedGroups.length) {
            throw new BadRequestException('Invalid group index');
        }

        // Remove the group at the specified index
        const updatedProposedGroups = simulation.proposedGroups.filter((_, index) => index !== groupIndex);

        // Renumber the remaining groups
        updatedProposedGroups.forEach((group, index) => {
            group.courseGroupName = `Group ${index + 1}`;
        });

        // Update uncovered students
        const totalCoveredStudents = updatedProposedGroups.reduce((sum, group) => sum + group.proposedCapacity, 0);
        const uncoveredStudents = Math.max(0, simulation.totalStudents - totalCoveredStudents);

        return {
            totalStudents: simulation.totalStudents,
            requiredGroups: updatedProposedGroups.length,
            proposedGroups: updatedProposedGroups,
            uncoveredStudents,
            canCreateEvent: uncoveredStudents === 0,
            availableLabs: simulation.availableLabs
        };
    }

    /**
     * Create event with complex group scheduling
     */
    async createEventWithGroups(createDto: imports.CreateEventWithGroupsDto): Promise<imports.Entity> {
        console.log('🚀 createEventWithGroups called with DTO:', JSON.stringify(createDto, null, 2));
        console.log('📋 Proposed groups received:', createDto.proposedGroups);
        console.log('📊 Number of proposed groups:', createDto.proposedGroups?.length || 0);
        console.log('🎯 Is exam:', createDto.isExam);
        console.log('📚 Exam models:', createDto.examModels?.length || 0);
        console.log('🔗 Group model assignments:', createDto.groupModelAssignments?.length || 0);

        // Create the event first with new structure
        const event = this.repository.create({
            name: createDto.name,
            description: createDto.description,
            duration: createDto.duration,
            eventType: createDto.eventType || imports.EventType.ASSIGNMENT,
            locationType: createDto.locationType || imports.LocationType.ONLINE,
            customLocation: createDto.customLocation,
            hasMarks: createDto.hasMarks,
            totalMarks: createDto.totalMarks,
            autoStart: createDto.autoStart || false,
            requiresModels: createDto.requiresModels || false,
            isExam: createDto.isExam || false,
            examModeStartMinutes: createDto.examModeStartMinutes || 30,
            startDateTime: createDto.startDateTime,
            courseId: createDto.courseId,
        });

        console.log('📝 Event entity created:', {
            id: event.id,
            name: event.name,
            isExam: event.isExam,
            requiresModels: event.requiresModels
        });

        const savedEvent = await this.repository.save(event);
        console.log('💾 Event saved with ID:', savedEvent.id);

        // Create exam models if this is an exam and models are provided
        let createdModelIds: string[] = [];
        if (createDto.isExam && createDto.examModels && createDto.examModels.length > 0) {
            console.log('📚 Creating exam models with file references...');
            createdModelIds = await this.createExamModelsWithFileIds(savedEvent.id, createDto.examModels);
            console.log('✅ Created exam models:', createdModelIds);
        }

        // Create groups and schedules from proposed groups
        if (createDto.proposedGroups && createDto.proposedGroups.length > 0) {
            console.log('🎯 Processing proposed groups...');

            // Call the existing method to create all groups from proposal
            await this.createGroupsFromProposal(savedEvent.id, createDto.courseId, createDto.proposedGroups);
            console.log('🎉 All groups processed successfully');

            // Assign models to groups if this is an exam and assignments are provided
            if (createDto.isExam && createDto.groupModelAssignments && createDto.groupModelAssignments.length > 0) {
                console.log('🔗 Assigning models to groups...');
                await this.assignModelsToGroups(savedEvent.id, createDto.groupModelAssignments, createdModelIds);
                console.log('✅ Model assignments completed');
            }
        } else {
            console.log('⚠️ No proposed groups provided');
        }

        console.log('✨ createEventWithGroups completed successfully');
        return savedEvent;
    }

    /**
     * Upload exam model files independently and return file IDs
     */
    async uploadExamModelFiles(files: Express.Multer.File[]): Promise<imports.UploadExamModelFilesResponseDto> {
        this.logger.log(`📁 Uploading ${files.length} exam model files`);

        const uploadedFiles = [];

        for (const file of files) {
            this.logger.log(`📎 Processing file: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);

            try {
                // Upload file using FileService to MinIO
                const uploadResult = await this.fileService.uploadFile(file, {
                    prefix: 'exam-models',
                    isPublic: false
                });

                uploadedFiles.push({
                    id: uploadResult.id.toString(), // Convert number ID to string for frontend
                    originalName: uploadResult.originalname,
                    size: uploadResult.size,
                    mimeType: uploadResult.mimetype
                });

                this.logger.log(`✅ Successfully uploaded file: ${file.originalname} with ID: ${uploadResult.id}`);
            } catch (error) {
                this.logger.error(`❌ Failed to upload file ${file.originalname}: ${error.message}`);
                throw error;
            }
        }

        this.logger.log(`✅ Successfully processed ${uploadedFiles.length} files`);
        return { uploadedFiles };
    }

    /**
     * Create groups from proposals and assign students
     */
    private async createGroupsFromProposal(
        eventId: UUID,
        courseId: UUID,
        proposedGroups: imports.ProposedGroupSimpleDto[]
    ): Promise<void> {
        this.logger.log(`Creating groups from proposal for event ${eventId}, course ${courseId}, ${proposedGroups.length} groups`);

        // Get the event to check if it's an exam
        const event = await this.repository.findOne({ where: { id: eventId } });
        const isExam = event?.isExam || false;

        // Get all students enrolled in the course, ordered alphabetically
        const students = await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('student_courses', 'sc', 'sc.student_id = user.id')
            .leftJoin('students', 'student', 'student.id = user.id')
            .addSelect(['student.seatNo'])
            .where('sc.course_id = :courseId', { courseId })
            .orderBy('user.name', 'ASC')
            .getMany();

        this.logger.log(`Found ${students.length} students enrolled in course ${courseId}`);

        let studentIndex = 0;

        // Create event schedules and exam groups for each proposed group
        for (let i = 0; i < proposedGroups.length; i++) {
            const group = proposedGroups[i];
            this.logger.log(`Creating group ${i + 1}: labId=${group.labId}, capacity=${group.proposedCapacity}, autoStart=${group.autoStart}`);

            // Create event schedule with autoStart from group
            const eventSchedule = this.eventScheduleRepository.create({
                eventId: eventId,
                labId: group.labId,
                dateTime: new Date(group.dateTime), // Use actual dateTime from group
                maxStudents: group.proposedCapacity,
                enrolledStudents: 0,
                autoStart: group.autoStart || false, // Use autoStart from the group
                assistantId: group.assistantIds[0] || null // Use first assistant ID (for now, we'll need to update the schema to support multiple assistants)
            });

            const savedSchedule = await this.eventScheduleRepository.save(eventSchedule);
            this.logger.log(`Created event schedule with ID: ${savedSchedule.id}`);

            // If this is an exam, create an ExamGroup record
            if (isExam) {
                // Find or create a course group for this lab (we'll use a default course group for now)
                // In a real scenario, you might want to map labs to specific course groups
                const defaultCourseGroup = await this.courseGroupRepository.findOne({
                    where: { courseId: courseId, isDefault: true }
                });

                if (defaultCourseGroup) {
                    const examGroup = this.examGroupRepository.create({
                        eventId: eventId,
                        groupNumber: i + 1,
                        expectedStudentCount: group.proposedCapacity,
                        actualStudentCount: 0,
                        notes: `Lab ID: ${group.labId}`
                    });

                    const savedExamGroup = await this.examGroupRepository.save(examGroup);
                    this.logger.log(`Created exam group with ID: ${savedExamGroup} for group ${i + 1}`);
                }
            }

            // Assign students to this schedule
            const studentsForThisGroup = students.slice(studentIndex, studentIndex + group.proposedCapacity);
            this.logger.log(`Assigning ${studentsForThisGroup.length} students to group ${i + 1}`);

            for (const student of studentsForThisGroup) {
                const studentSchedule = this.studentEventScheduleRepository.create({
                    eventSchedule_id: savedSchedule.id,
                    student_id: student.id,
                    isInExamMode: false,
                    hasAttended: false
                });

                await this.studentEventScheduleRepository.save(studentSchedule);
            }

            // Update enrolled student count
            await this.eventScheduleRepository.update(savedSchedule.id, {
                enrolledStudents: studentsForThisGroup.length
            });

            // Update exam group actual student count if it's an exam
            if (isExam) {
                const examGroup = await this.examGroupRepository.findOne({
                    where: { eventId: eventId, groupNumber: i + 1 }
                });
                if (examGroup) {
                    await this.examGroupRepository.update(examGroup.id, {
                        actualStudentCount: studentsForThisGroup.length
                    });
                }
            }

            this.logger.log(`Updated enrolled student count to ${studentsForThisGroup.length} for schedule ${savedSchedule.id}`);

            studentIndex += group.proposedCapacity;
        }

        this.logger.log(`Completed creating ${proposedGroups.length} groups for event ${eventId}`);
    }

    /**
     * Create exam models for an event
     */
    private async createExamModelsForEvent(eventId: UUID, examModels: imports.ExamModelForEventDto[]): Promise<string[]> {
        // For now, return empty array as we'll implement this when we have the exam model system ready
        this.logger.log(`Creating ${examModels.length} exam models for event ${eventId}`);
        return [];
    }

    /**
     * Create exam models from uploaded files
     */
    private async createExamModelsFromFiles(
        eventId: UUID,
        examModelFiles: Express.Multer.File[],
        examModelData?: imports.ExamModelForEventDto[]
    ): Promise<string[]> {
        this.logger.log(`Creating exam models from ${examModelFiles.length} uploaded files for event ${eventId}`);

        // Group files by model name (from form data)
        const filesByModel = new Map<string, Express.Multer.File[]>();

        // If we have exam model data from the form, use it to organize files
        if (examModelData && examModelData.length > 0) {
            examModelData.forEach((model, index) => {
                filesByModel.set(model.name, []);
            });

            // Assign files to models based on naming convention or order
            examModelFiles.forEach((file, index) => {
                const modelIndex = Math.floor(index / Math.max(1, Math.floor(examModelFiles.length / examModelData.length)));
                const modelName = examModelData[modelIndex]?.name || `Model ${String.fromCharCode(65 + modelIndex)}`;

                if (!filesByModel.has(modelName)) {
                    filesByModel.set(modelName, []);
                }
                filesByModel.get(modelName)!.push(file);
            });
        } else {
            // Create models based on file grouping (A, B, C, etc.)
            examModelFiles.forEach((file, index) => {
                const modelLetter = String.fromCharCode(65 + Math.floor(index / Math.max(1, Math.floor(examModelFiles.length / 4)))); // Assume max 4 models
                const modelName = `Model ${modelLetter}`;

                if (!filesByModel.has(modelName)) {
                    filesByModel.set(modelName, []);
                }
                filesByModel.get(modelName)!.push(file);
            });
        }

        const createdModelIds: string[] = [];

        // Create exam models (placeholder - implement actual exam model creation when ready)
        for (const [modelName, files] of filesByModel.entries()) {
            this.logger.log(`Creating model "${modelName}" with ${files.length} files`);

            // TODO: Implement actual exam model creation with MinIO file upload
            // For now, just log the file details
            files.forEach(file => {
                this.logger.log(`- File: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);
            });

            // Generate a placeholder model ID
            const modelId = `${eventId}-${modelName.toLowerCase().replace(' ', '-')}`;
            createdModelIds.push(modelId);
        }

        return createdModelIds;
    }

    /**
     * Assign models to groups
     */
    private async assignModelsToGroups(eventId: UUID, assignments: imports.GroupModelAssignmentDto[], modelIds: string[]): Promise<void> {
        this.logger.log(`🔗 Assigning models to ${assignments.length} groups for event ${eventId}`);

        // Get all exam groups for this event
        const examGroups = await this.examGroupRepository.find({
            where: { eventId: eventId },
            order: { groupNumber: 'ASC' }
        });

        if (examGroups.length === 0) {
            this.logger.warn(`⚠️ No exam groups found for event ${eventId}`);
            return;
        }

        // Get all exam models for this event
        const examModels = await this.examModelRepository.find({
            where: { eventId: eventId }
        });

        if (examModels.length === 0) {
            this.logger.warn(`⚠️ No exam models found for event ${eventId}`);
            return;
        }

        this.logger.log(`📊 Found ${examGroups.length} exam groups and ${examModels.length} exam models`);

        // Process each assignment
        for (const assignment of assignments) {
            const groupIndex = assignment.groupIndex;
            const modelNames = assignment.assignedModelNames;

            // Get the exam group for this assignment (groups are 0-indexed in assignment, but groupNumber is 1-indexed)
            const examGroup = examGroups.find(group => group.groupNumber === groupIndex + 1);

            if (!examGroup) {
                this.logger.error(`❌ Exam group not found for group index ${groupIndex} (group number ${groupIndex + 1})`);
                continue;
            }

            this.logger.log(`🎯 Processing assignment for group ${groupIndex + 1} (ID: ${examGroup.id}): models [${modelNames.join(', ')}]`);

            // Find exam models by name
            const modelsToAssign = examModels.filter(model => modelNames.includes(model.name));

            if (modelsToAssign.length === 0) {
                this.logger.warn(`⚠️ No exam models found matching names [${modelNames.join(', ')}] for group ${groupIndex + 1}`);
                continue;
            }

            this.logger.log(`✅ Found ${modelsToAssign.length} models to assign to group ${groupIndex + 1}: [${modelsToAssign.map(m => m.name).join(', ')}]`);

            // Assign models to the exam group using the ManyToMany relationship
            try {
                // Load the current assigned models
                const currentModels = await examGroup.assignedModels;

                // Add new models to the existing ones (avoid duplicates)
                const newModels = modelsToAssign.filter(newModel =>
                    !currentModels.some(existing => existing.id === newModel.id)
                );

                if (newModels.length > 0) {
                    // Update the relationship
                    const allModels = [...currentModels, ...newModels];

                    // Use query builder to update the junction table
                    await this.examGroupRepository
                        .createQueryBuilder()
                        .relation(ExamGroup, 'assignedModels')
                        .of(examGroup.id)
                        .add(newModels.map(model => model.id));

                    this.logger.log(`✅ Successfully assigned ${newModels.length} new models to group ${groupIndex + 1}`);
                } else {
                    this.logger.log(`ℹ️ All specified models already assigned to group ${groupIndex + 1}`);
                }
            } catch (error) {
                this.logger.error(`❌ Failed to assign models to group ${groupIndex + 1}: ${error.message}`);
                throw error;
            }
        }

        this.logger.log(`🎉 Completed model assignments for event ${eventId}`);
    }

    /**
     * Assign students to groups lexicographically (by name)
     */
    private async assignStudentsLexicographically(eventId: UUID, courseId: UUID): Promise<void> {
        // Get all students enrolled in the course, ordered alphabetically
        const students = await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('student_courses', 'sc', 'sc.student_id = user.id')
            .leftJoin('students', 'student', 'student.id = user.id')
            .addSelect(['student.seatNo'])
            .where('sc.course_id = :courseId', { courseId })
            .orderBy('user.name', 'ASC')
            .getMany();

        // Get all event schedules for this event
        const eventSchedules = await this.eventScheduleRepository.find({
            where: { eventId },
            order: { dateTime: 'ASC' }
        });

        // Distribute students evenly across schedules
        let scheduleIndex = 0;
        for (const student of students) {
            const targetSchedule = eventSchedules[scheduleIndex % eventSchedules.length];

            // Create student event schedule entry
            const studentSchedule = this.studentEventScheduleRepository.create({
                eventSchedule_id: targetSchedule.id,
                student_id: student.id,
                isInExamMode: false,
                hasAttended: false
            });

            await this.studentEventScheduleRepository.save(studentSchedule);
            scheduleIndex++;
        }

        // Update enrolled student counts
        for (const schedule of eventSchedules) {
            const enrolledCount = await this.studentEventScheduleRepository.count({
                where: { eventSchedule_id: schedule.id }
            });
            await this.eventScheduleRepository.update(schedule.id, { enrolledStudents: enrolledCount });
        }
    }

    /**
     * Move student between groups
     */
    async moveStudentBetweenGroups(moveDto: imports.MoveStudentBetweenGroupsDto): Promise<{ success: boolean; message: string }> {
        // Validate source group has the student
        const sourceEnrollment = await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('student_courses', 'sc', 'sc.student_id = user.id')
            .where('sc.student_id = :studentId', { studentId: moveDto.studentId })
            .andWhere('sc.course_group_id = :fromGroupId', { fromGroupId: moveDto.fromCourseGroupId })
            .andWhere('sc.course_id = :courseId', { courseId: moveDto.courseId })
            .getOne();

        if (!sourceEnrollment) {
            throw new BadRequestException('Student is not enrolled in the source group');
        }

        // Check target group capacity
        const targetGroup = await this.courseGroupRepository.findOne({
            where: { id: moveDto.toCourseGroupId },
            relations: ['lab']
        });

        if (!targetGroup) {
            throw new BadRequestException('Target group not found');
        }

        const targetGroupCurrentCount = await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('student_courses', 'sc', 'sc.student_id = user.id')
            .where('sc.course_group_id = :groupId', { groupId: moveDto.toCourseGroupId })
            .getCount();

        const lab = await targetGroup.lab;
        const maxCapacity = Math.min(targetGroup.capacity || Infinity, lab?.capacity || Infinity);

        if (targetGroupCurrentCount >= maxCapacity) {
            throw new BadRequestException(`Target group is at full capacity (${maxCapacity})`);
        }

        // Update student course enrollment
        await this.userRepository.manager.query(
            `UPDATE student_courses SET course_group_id = $1 WHERE student_id = $2 AND course_id = $3`,
            [moveDto.toCourseGroupId, moveDto.studentId, moveDto.courseId]
        );

        return {
            success: true,
            message: 'Student moved successfully between groups'
        };
    }

    /**
     * Get student grades summary for a course
     */
    async getStudentGradesSummary(courseId: UUID): Promise<imports.StudentGradesSummaryDto[]> {
        // Get all students enrolled in the course
        const students = await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('student_courses', 'sc', 'sc.student_id = user.id')
            .leftJoin('students', 'student', 'student.id = user.id')
            .addSelect(['student.seatNo'])
            .where('sc.course_id = :courseId', { courseId })
            .orderBy('user.name', 'ASC')
            .getMany();

        const gradesSummary: imports.StudentGradesSummaryDto[] = [];

        for (const student of students) {
            // Get all event marks for this student in this course
            const eventMarks = await this.studentEventScheduleRepository
                .createQueryBuilder('ses')
                .leftJoin('event_schedules', 'es', 'es.id = ses.eventSchedule_id')
                .leftJoin('events', 'event', 'event.id = es.event_id')
                .select([
                    'event.id as eventId',
                    'event.name as eventName',
                    'event.hasMarks as hasMarks',
                    'event.totalMarks as totalMarks',
                    'ses.eventSchedule_id as eventScheduleId',
                    'ses.mark as mark',
                    'ses.hasAttended as hasAttended',
                    'es.dateTime as dateTime'
                ])
                .where('ses.student_id = :studentId', { studentId: student.id })
                .andWhere('event.courseId = :courseId', { courseId })
                .andWhere('event.hasMarks = :hasMarks', { hasMarks: true })
                .orderBy('es.dateTime', 'ASC')
                .getRawMany();

            let totalMarks = 0;
            let earnedMarks = 0;

            const eventMarkDtos: imports.EventMarkDto[] = eventMarks.map(mark => {
                const markValue = mark.mark || 0;
                const totalValue = mark.totalMarks || 0;

                totalMarks += totalValue;
                earnedMarks += markValue;

                return {
                    eventId: mark.eventId,
                    eventName: mark.eventName,
                    eventScheduleId: mark.eventScheduleId,
                    mark: markValue,
                    totalMarks: totalValue,
                    percentage: totalValue > 0 ? (markValue / totalValue) * 100 : 0,
                    hasAttended: mark.hasAttended || false,
                    dateTime: mark.dateTime
                };
            });

            const studentData = await this.userRepository
                .createQueryBuilder('user')
                .leftJoin('students', 'student', 'student.id = user.id')
                .addSelect(['student.seatNo'])
                .where('user.id = :studentId', { studentId: student.id })
                .getRawOne();

            gradesSummary.push({
                studentId: student.id,
                studentName: student.name,
                username: student.username,
                seatNo: studentData?.student_seatNo || '',
                totalMarks,
                earnedMarks,
                percentage: totalMarks > 0 ? (earnedMarks / totalMarks) * 100 : 0,
                eventMarks: eventMarkDtos
            });
        }

        return gradesSummary;
    }

    /**
     * Get my grades (for student dashboard)
     */
    async getMyGrades(studentId: UUID): Promise<imports.StudentGradesSummaryDto[]> {
        // Get all courses the student is enrolled in
        const enrolledCourses = await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('student_courses', 'sc', 'sc.student_id = user.id')
            .leftJoin('courses', 'course', 'course.id = sc.course_id')
            .select(['course.id', 'course.name'])
            .where('user.id = :studentId', { studentId })
            .getRawMany();

        const allGrades: imports.StudentGradesSummaryDto[] = [];

        for (const course of enrolledCourses) {
            const courseGrades = await this.getStudentGradesSummary(course.course_id);
            const myGrades = courseGrades.find(g => g.studentId === studentId);
            if (myGrades) {
                allGrades.push(myGrades);
            }
        }

        return allGrades;
    }

    /**
     * Create exam models with file IDs (files already uploaded)
     */
    private async createExamModelsWithFileIds(eventId: UUID, examModels: imports.ExamModelForEventDto[]): Promise<string[]> {
        this.logger.log(`Creating ${examModels.length} exam models with file IDs for event ${eventId}`);

        const createdModelIds: string[] = [];

        for (let i = 0; i < examModels.length; i++) {
            const model = examModels[i];
            this.logger.log(`Creating model "${model.name}" with ${model.fileIds?.length || 0} file references`);

            try {
                // Create the exam model entity
                const version = String.fromCharCode(65 + i); // A, B, C, D...

                const examModel = this.examModelRepository.create({
                    name: model.name,
                    version: version,
                    description: model.description,
                    eventId: eventId,
                    assignedStudentCount: 0,
                    isActive: true,
                });

                const savedModel = await this.examModelRepository.save(examModel);
                this.logger.log(`Created exam model: ${savedModel.id} (${savedModel.name} - Version ${savedModel.version})`);

                // Create file references for uploaded files
                if (model.fileIds && model.fileIds.length > 0) {
                    this.logger.log(`Linking ${model.fileIds.length} files to exam model ${savedModel.id}`);

                    for (const fileId of model.fileIds) {
                        try {
                            // Verify the file exists - parse as number since file IDs are numbers
                            const uploadedFile = await this.fileService.getFileById(parseInt(fileId));
                            if (uploadedFile) {
                                // Create exam model file relationship record (only stores IDs)
                                const examModelFile = this.examModelFileRepository.create({
                                    examModelId: savedModel.id,
                                    fileId: parseInt(fileId),
                                });

                                await this.examModelFileRepository.save(examModelFile);
                                this.logger.log(`- Linked file ${fileId} (${uploadedFile.originalname}) to model ${savedModel.id}`);
                            } else {
                                this.logger.error(`File with ID ${fileId} not found`);
                            }
                        } catch (fileError) {
                            this.logger.error(`Failed to link file ${fileId} to model ${savedModel.id}: ${fileError.message}`);
                        }
                    }
                }

                createdModelIds.push(savedModel.id);
            } catch (error) {
                this.logger.error(`Failed to create exam model "${model.name}": ${error.message}`);
                throw error;
            }
        }

        this.logger.log(`Successfully created ${createdModelIds.length} exam models for event ${eventId}`);
        return createdModelIds;
    }

    /**
     * Get student's submitted files for an exam
     */
    async getStudentFiles(
        studentId: UUID,
        eventScheduleId: UUID
    ): Promise<StudentFileDto[]> {
        // Verify student is enrolled in this exam schedule
        const studentSchedule = await this.studentEventScheduleRepository.findOne({
            where: {
                student_id: studentId,
                eventSchedule_id: eventScheduleId
            },
            relations: ['eventSchedule', 'eventSchedule.event']
        });

        if (!studentSchedule) {
            throw new NotFoundException('Student not enrolled in this exam');
        }

        const schedule = await studentSchedule.eventSchedule;
        const event = await schedule.event;
        const studentFiles = await this.studentFilesService.getStudentExamFiles(studentId, event.id);

        const fileDtos: StudentFileDto[] = [];
        for (const file of studentFiles) {
            const fileRecord = await file.file;
            fileDtos.push({
                id: file.id.toString(),
                name: fileRecord.originalname,
                url: fileRecord.objectName,
                size: fileRecord.size,
                type: fileRecord.mimetype,
                submittedAt: file.date
            });
        }

        return fileDtos;
    }

    /**
     * Delete a student's submitted file
     */
    async deleteStudentFile(
        studentId: UUID,
        scheduleId: UUID,
        fileId: string
    ): Promise<void> {
        // Verify student is enrolled in this exam schedule and get the eventId
        const studentSchedule = await this.studentEventScheduleRepository.findOne({
            where: {
                student_id: studentId,
                eventSchedule_id: scheduleId
            },
            relations: ['eventSchedule', 'eventSchedule.event']
        });

        if (!studentSchedule) {
            throw new NotFoundException('Student not enrolled in this exam');
        }

        const schedule = await studentSchedule.eventSchedule;
        const event = await schedule.event;

        // Verify that this file actually belongs to this student for this specific event
        const studentFile = await this.studentFilesService.getStudentFileByIds(
            studentId,
            event.id,
            parseInt(fileId)
        );

        if (!studentFile) {
            throw new ForbiddenException('You do not have permission to delete this file or the file does not exist for this event');
        }

        await this.studentFilesService.deleteStudentFile(parseInt(fileId));
    }
}
