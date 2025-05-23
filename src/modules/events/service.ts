import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import { Course } from 'src/database/courses/course.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { EventSchedule, ExamStatus, StudentEventSchedule } from 'src/database/events/event_schedules.entity';
import { ExamGroup } from 'src/database/events/exam-groups.entity';
import { Lab } from 'src/database/labs/lab.entity';
import { User } from 'src/database/users/user.entity';
import { WebsocketService } from 'src/websockets/websocket.service';
import { ChannelType, getChannelName, WSEventType, ExamModeData, ExamAccessData } from 'src/websockets/websocket.interfaces';
import { UUID } from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FileService } from '../files/file.service';
import * as ExcelJS from 'exceljs';
import * as archiver from 'archiver';
import { Readable } from 'stream';

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

export interface ExamModeStatus {
	isInExamMode: boolean;
	examStartsIn?: number; // minutes
	examSchedules: {
		eventScheduleId: UUID;
		eventName: string;
		dateTime: Date;
		status: ExamStatus;
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
		@InjectRepository(Lab) private readonly labRepository: Repository<Lab>,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		private readonly websocketService: WebsocketService,
		private readonly fileService: FileService,
	) {
		super(imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto, repository);
	}

	async beforeCreateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		const lab = await this.courseRepository.findOneBy({ id: dto.courseId });
		if (!lab) {
			throw new BadRequestException('Invalid lab id!');
		}
		return dto;
	}
	async beforeUpdateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		const lab = await this.courseRepository.findOneBy({ id: dto.courseId });
		if (!lab) {
			throw new BadRequestException('Invalid lab id!');
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

		// Get available labs if exam is in lab
		let availableLabs: any[] = [];
		if (event.isInLab) {
			availableLabs = await this.labRepository
				.createQueryBuilder('lab')
				.leftJoin('course_labs', 'cl', 'cl.lab_id = lab.id')
				.where('cl.course_id = :courseId', { courseId: event.courseId })
				.getMany();
		}

		const groupDistribution = courseGroups.entities.map((group, index) => {
			const studentCount = parseInt(courseGroups.raw[index].studentCount) || 0;
			const maxCapacity = event.isInLab ? group.capacity || 30 : 50; // Default capacities
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
				where: { eventId, courseGroupId: schedule.courseGroupId },
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
					courseGroupId: schedule.courseGroupId,
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
	async getStudentExamModeStatus(studentId: UUID): Promise<ExamModeStatus> {
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
			.select(['es.id', 'es.dateTime', 'es.status', 'e.name', 'e.examModeStartMinutes'])
			.getRawMany();

		const now = new Date();
		let isInExamMode = false;
		const examModeSchedules = [];

		for (const schedule of examSchedules) {
			const examStartTime = new Date(schedule.es_dateTime);
			const examModeStartTime = new Date(examStartTime.getTime() - schedule.e_examModeStartMinutes * 60 * 1000);

			const isScheduleInExamMode = now >= examModeStartTime && now <= examStartTime;
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
	 * Start exam manually
	 */
	async startExam(eventScheduleId: UUID, adminId: UUID): Promise<void> {
		const schedule = await this.eventScheduleRepository.findOne({
			where: { id: eventScheduleId },
			relations: ['event'],
		});

		if (!schedule) {
			throw new NotFoundException('Event schedule not found');
		}

		if (schedule.status !== ExamStatus.SCHEDULED && schedule.status !== ExamStatus.EXAM_MODE_ACTIVE) {
			throw new BadRequestException('Exam cannot be started from current status');
		}

		// Update status and start time
		await this.eventScheduleRepository.update(
			{ id: eventScheduleId },
			{
				status: ExamStatus.STARTED,
				actualStartTime: new Date(),
			},
		);

		// Notify students via WebSocket
		const event = await schedule.event;
		await this.notifyExamStart(eventScheduleId, event.name);

		this.logger.log(`Exam started manually by admin ${adminId} for schedule ${eventScheduleId}`);
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

		// Handle exam mode activation (30 minutes before exam)
		await this.activateExamMode(now);

		// Handle auto-start exams
		await this.autoStartExams(now);

		// Handle auto-end exams
		await this.autoEndExams(now);
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

				this.logger.log(`Exam mode activated for schedule ${schedule.es_id}`);
			}
		}
	}

	private async autoStartExams(now: Date): Promise<void> {
		const schedules = await this.eventScheduleRepository
			.createQueryBuilder('es')
			.leftJoin('events', 'e', 'e.id = es.event_id')
			.where('es.status = :status', { status: ExamStatus.EXAM_MODE_ACTIVE })
			.andWhere('e.autoStart = true')
			.andWhere('es.dateTime <= :now', { now })
			.select(['es.id', 'e.name'])
			.getRawMany();

		for (const schedule of schedules) {
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

			this.logger.log(`Exam auto-started for schedule ${schedule.es_id}`);
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

				this.logger.log(`Exam auto-ended for schedule ${schedule.es_id}`);
			}
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
			relations: ['eventSchedule', 'eventSchedule.event']
		});

		if (!studentSchedule) {
			throw new NotFoundException('Student not enrolled in this exam');
		}

		// Check if exam is in progress or ended (allow submissions during exam)
		const schedule = await studentSchedule.eventSchedule;
		const event = await schedule.event;

		if (schedule.status !== ExamStatus.STARTED && schedule.status !== ExamStatus.ENDED) {
			throw new BadRequestException('Exam is not active for file submissions');
		}

		// Upload files
		const uploadedFiles: string[] = [];
		for (const file of files) {
			const uploadResult = await this.fileService.uploadFile(file, {
				prefix: `exam-submissions/${eventScheduleId}/${studentId}`,
				isPublic: false
			});
			uploadedFiles.push(uploadResult.url || uploadResult.objectName);
		}

		const submittedAt = new Date();

		// Update student schedule with submitted files
		await this.studentEventScheduleRepository.update(
			{ student_id: studentId, eventSchedule_id: eventScheduleId },
			{
				submittedFiles: JSON.stringify(uploadedFiles),
				submittedAt: submittedAt
			}
		);

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
	 * Assign random exam models to students
	 */
	private async assignRandomExamModels(eventScheduleId: UUID, examModels: string[]): Promise<void> {
		const studentSchedules = await this.studentEventScheduleRepository.find({
			where: { eventSchedule_id: eventScheduleId }
		});

		for (const studentSchedule of studentSchedules) {
			const randomIndex = Math.floor(Math.random() * examModels.length);
			const assignedModel = examModels[randomIndex];

			await this.studentEventScheduleRepository.update(
				{
					student_id: studentSchedule.student_id,
					eventSchedule_id: eventScheduleId
				},
				{ assignedExamModelUrl: assignedModel }
			);
		}

		this.logger.log(`Assigned random exam models to ${studentSchedules.length} students for schedule ${eventScheduleId}`);
	}

	/**
	 * Get assigned exam model for a student
	 */
	async getStudentAssignedExamModel(
		studentId: UUID,
		eventScheduleId: UUID
	): Promise<{ examModel: string; examModelUrl: string }> {
		const studentSchedule = await this.studentEventScheduleRepository.findOne({
			where: {
				student_id: studentId,
				eventSchedule_id: eventScheduleId
			},
			relations: ['eventSchedule']
		});

		if (!studentSchedule) {
			throw new NotFoundException('Student not enrolled in this exam');
		}

		const schedule = await studentSchedule.eventSchedule;
		if (schedule.status !== ExamStatus.STARTED) {
			throw new BadRequestException('Exam has not started yet');
		}

		if (!studentSchedule.assignedExamModelUrl) {
			throw new NotFoundException('No exam model assigned to this student');
		}

		return {
			examModel: studentSchedule.examModel || 'Model',
			examModelUrl: studentSchedule.assignedExamModelUrl
		};
	}

	/**
	 * Download all student submissions as ZIP file
	 */
	async downloadAllSubmissions(eventScheduleId: UUID): Promise<{ buffer: Buffer; filename: string; excelBuffer: Buffer }> {
		const schedule = await this.eventScheduleRepository.findOne({
			where: { id: eventScheduleId },
			relations: ['event']
		});

		if (!schedule) {
			throw new NotFoundException('Event schedule not found');
		}

		const event = await schedule.event;

		// Get all student submissions
		const studentSchedules = await this.studentEventScheduleRepository
			.createQueryBuilder('ses')
			.leftJoinAndSelect('ses.student', 'user')
			.leftJoin('students', 'student', 'student.id = user.id')
			.addSelect(['student.seatNo'])
			.where('ses.eventSchedule_id = :scheduleId', { scheduleId: eventScheduleId })
			.getMany();

		// Create ZIP archive
		const archive = archiver('zip', { zlib: { level: 9 } });
		const buffers: Buffer[] = [];

		archive.on('data', (chunk: Buffer) => buffers.push(chunk));

		// Create Excel sheet for marks
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Student Marks');

		// Add headers
		worksheet.columns = [
			{ header: 'Student Name', key: 'studentName', width: 25 },
			{ header: 'Seat No', key: 'seatNo', width: 15 },
			{ header: 'Mark', key: 'mark', width: 10 }
		];

		// Process each student
		for (const studentSchedule of studentSchedules) {
			const user = await studentSchedule.student;
			const studentName = user.name;
			const seatNo = studentSchedule.seatNo || 'N/A';

			// Add to Excel sheet
			worksheet.addRow({
				studentName: studentName,
				seatNo: seatNo,
				mark: studentSchedule.mark || ''
			});

			// Create folder for student
			const studentFolder = `${studentName}_${seatNo}/`;

			// Add submitted files to student folder
			if (studentSchedule.submittedFiles) {
				const submittedFiles = JSON.parse(studentSchedule.submittedFiles);
				for (let i = 0; i < submittedFiles.length; i++) {
					const fileUrl = submittedFiles[i];
					// Note: In a real implementation, you would download the file from MinIO/S3
					// For now, we'll add a placeholder
					archive.append(`File content placeholder for ${fileUrl}`, {
						name: `${studentFolder}file_${i + 1}.txt`
					});
				}
			}

			// If no files submitted, add placeholder
			if (!studentSchedule.submittedFiles) {
				archive.append('No files submitted', {
					name: `${studentFolder}no_submission.txt`
				});
			}
		}

		// Generate Excel buffer
		const excelBuffer = await workbook.xlsx.writeBuffer() as Buffer;

		// Add Excel sheet to ZIP
		archive.append(excelBuffer, { name: 'student_marks_template.xlsx' });

		// Finalize ZIP
		await archive.finalize();

		return new Promise((resolve, reject) => {
			archive.on('end', () => {
				const zipBuffer = Buffer.concat(buffers);
				resolve({
					buffer: zipBuffer,
					filename: `${event.name}_submissions_${new Date().toISOString().split('T')[0]}.zip`,
					excelBuffer: excelBuffer
				});
			});

			archive.on('error', reject);
		});
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
}
