import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import { Course } from 'src/database/courses/course.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { StudentCourses } from 'src/database/students/student_courses.entity';
import { LabSessionAttentance } from 'src/database/lab_sessions/lab_session_attendance.entity';
import { Device } from 'src/database/devices/device.entity';
import { DeviceLoginHistory } from 'src/database/devices/device-login-history.entity';
import { Student } from 'src/database/students/student.entity';
import { User } from 'src/database/users/user.entity';
import { Lab } from 'src/database/labs/lab.entity';
import { transformToInstance } from 'src/base/transformToInstance';
import {
	StartLabSessionDto,
	ActiveSessionDetailsDto,
	TakeAttendanceDto,
	AddStudentToSessionDto,
	AwardExtraPointsDto,
	SessionDeviceStatusDto,
	SessionStudentDto
} from './dtos';
import { UUID } from './imports';

@Injectable()
export class LabSessionService extends BaseService<imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
		@InjectRepository(Course) private readonly courseRepository: Repository<Course>,
		@InjectRepository(CourseGroup) private readonly courseGroupRepository: Repository<CourseGroup>,
		@InjectRepository(StudentCourses) private readonly studentCourseRepository: Repository<StudentCourses>,
		@InjectRepository(LabSessionAttentance) private readonly attendanceRepository: Repository<LabSessionAttentance>,
		@InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
		@InjectRepository(DeviceLoginHistory) private readonly deviceLoginRepository: Repository<DeviceLoginHistory>,
		@InjectRepository(Student) private readonly studentRepository: Repository<Student>,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		@InjectRepository(Lab) private readonly labRepository: Repository<Lab>,
	) {
		super(imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto, repository);
	}

	async beforeCreateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		const course = await this.courseRepository.findOneBy({ id: dto.courseId });
		if (!course) {
			throw new BadRequestException('Invalid course id!');
		}
		return dto;
	}

	async beforeUpdateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		const course = await this.courseRepository.findOneBy({ id: dto.courseId });
		if (!course) {
			throw new BadRequestException('Invalid course id!');
		}
		return dto;
	}

	// NEW: Session Management Methods

	async startLabSession(assistantId: UUID, startSessionDto: StartLabSessionDto): Promise<imports.GetDto> {
		// Validate course group exists and assistant has permission
		const courseGroup = await this.courseGroupRepository.findOne({
			where: { id: startSessionDto.courseGroupId },
			relations: ['course', 'lab']
		});

		if (!courseGroup) {
			throw new NotFoundException('Course group not found!');
		}

		// Check if assistant is assigned to this group (via course group schedules)
		const isAssistantAssigned = await this.repository.manager.query(`
			SELECT 1 FROM course_group_schedules 
			WHERE course_group_id = $1 AND assistant_id = $2
		`, [startSessionDto.courseGroupId, assistantId]);

		if (isAssistantAssigned.length === 0) {
			throw new BadRequestException('You are not assigned to this course group!');
		}

		// Check if there's already an active session for this group today
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const existingSession = await this.repository.findOne({
			where: {
				courseId: courseGroup.courseId,
				groupNumber: courseGroup.order,
				date: {
					$gte: today,
					$lt: tomorrow
				} as any
			}
		});

		if (existingSession) {
			throw new BadRequestException('A session for this group is already active today!');
		}

		// Create new lab session
		const labSession = this.repository.create({
			courseId: courseGroup.courseId,
			groupNumber: courseGroup.order,
			date: startSessionDto.sessionDateTime
		});

		const savedSession = await this.repository.save(labSession);

		// Create attendance records for all students in the group
		const studentsInGroup = await this.studentCourseRepository.find({
			where: { courseGroupId: startSessionDto.courseGroupId }
		});

		for (const studentCourse of studentsInGroup) {
			const attendance = this.attendanceRepository.create({
				studentId: studentCourse.studentId,
				labSessionId: savedSession.id,
				isAttended: false // Initially mark as absent
			});
			await this.attendanceRepository.save(attendance);
		}

		return transformToInstance(imports.GetDto, savedSession);
	}

	async getActiveSessionDetails(assistantId: UUID, courseGroupId: UUID): Promise<ActiveSessionDetailsDto> {
		// Validate assistant permission
		const isAssistantAssigned = await this.repository.manager.query(`
			SELECT 1 FROM course_group_schedules 
			WHERE course_group_id = $1 AND assistant_id = $2
		`, [courseGroupId, assistantId]);

		if (isAssistantAssigned.length === 0) {
			throw new BadRequestException('You are not assigned to this course group!');
		}

		// Get course group details
		const courseGroup = await this.courseGroupRepository.findOne({
			where: { id: courseGroupId },
			relations: ['course', 'lab']
		});

		if (!courseGroup) {
			throw new NotFoundException('Course group not found!');
		}

		// Find today's active session
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const activeSession = await this.repository.findOne({
			where: {
				courseId: courseGroup.courseId,
				groupNumber: courseGroup.order,
				date: {
					$gte: today,
					$lt: tomorrow
				} as any
			}
		});

		if (!activeSession) {
			throw new NotFoundException('No active session found for today!');
		}

		// Get course and lab details
		const course = await courseGroup.course;
		const lab = courseGroup.labId ? await courseGroup.lab : null;

		// Get devices in the lab
		const devices = lab ? await this.getSessionDeviceStatus(lab.id) : [];

		// Get students in the group with attendance status
		const students = await this.getSessionStudents(activeSession.id, courseGroupId);

		return transformToInstance(ActiveSessionDetailsDto, {
			sessionId: activeSession.id,
			course: {
				id: course.id,
				name: course.name,
				code: `${course.subjectCode}${course.courseNumber}`
			},
			group: {
				id: courseGroup.id,
				name: courseGroup.isDefault ? 'No Group' : `Group ${String.fromCharCode(64 + courseGroup.order)}`,
				order: courseGroup.order
			},
			lab: lab ? {
				id: lab.id,
				name: lab.name
			} : null,
			startTime: activeSession.date,
			expectedDuration: 120, // Default 2 hours, could be made configurable
			devices,
			students
		});
	}

	private async getSessionDeviceStatus(labId: UUID): Promise<SessionDeviceStatusDto[]> {
		// Get all devices in the lab
		const devices = await this.deviceRepository.find({
			where: { labId }
		});

		const deviceStatus: SessionDeviceStatusDto[] = [];

		for (const device of devices) {
			// Get current login for this device (if any)
			const currentLogin = await this.deviceLoginRepository.findOne({
				where: {
					deviceId: device.id,
					logoutTime: null // Still logged in
				},
				relations: ['student']
			});

			let currentUser = null;
			if (currentLogin) {
				const user = await currentLogin.user;
				currentUser = {
					studentId: user.id,
					studentName: user.name,
					username: user.username
				};
			}

			deviceStatus.push({
				deviceId: device.id,
				deviceName: device.name,
				isActive: !device.hasIssue,
				currentUser,
				loginTime: currentLogin?.loginTime
			});
		}

		return deviceStatus;
	}

	private async getSessionStudents(sessionId: UUID, courseGroupId: UUID): Promise<SessionStudentDto[]> {
		// Get all students in the group with their attendance status
		const query = `
			SELECT 
				s.id as "studentId",
				u.name as "studentName",
				u.username,
				u.email,
				COALESCE(lsa.is_attended, false) as "isPresent",
				COALESCE(lsa.attendance_points, 0) as "attendancePoints",
				COALESCE(lsa.extra_points, 0) as "extraPoints",
				d.id as "deviceId",
				d.name as "deviceName"
			FROM student_courses sc
			INNER JOIN students s ON sc.student_id = s.id
			INNER JOIN users u ON s.user_id = u.id
			LEFT JOIN lab_session_attendance lsa ON lsa.student_id = s.id AND lsa.lab_session_id = $1
			LEFT JOIN device_login_history dlh ON dlh.student_id = s.id AND dlh.logout_time IS NULL
			LEFT JOIN devices d ON dlh.device_id = d.id
			WHERE sc.course_group_id = $2
			ORDER BY u.name
		`;

		const results = await this.repository.manager.query(query, [sessionId, courseGroupId]);

		return results.map((row: any) => transformToInstance(SessionStudentDto, {
			studentId: row.studentId,
			studentName: row.studentName,
			username: row.username,
			email: row.email,
			isPresent: row.isPresent,
			assignedDevice: row.deviceId ? {
				deviceId: row.deviceId,
				deviceName: row.deviceName
			} : null,
			attendancePoints: row.attendancePoints || 0,
			extraPoints: row.extraPoints || 0
		}));
	}

	async takeAttendance(assistantId: UUID, sessionId: UUID, attendanceDto: TakeAttendanceDto): Promise<void> {
		// Validate session exists and assistant has permission
		const session = await this.repository.findOneBy({ id: sessionId });
		if (!session) {
			throw new NotFoundException('Session not found!');
		}

		// Find course group for this session
		const courseGroup = await this.courseGroupRepository.findOne({
			where: {
				courseId: session.courseId,
				order: session.groupNumber
			}
		});

		if (!courseGroup) {
			throw new NotFoundException('Course group not found!');
		}

		// Check assistant permission
		const isAssistantAssigned = await this.repository.manager.query(`
			SELECT 1 FROM course_group_schedules 
			WHERE course_group_id = $1 AND assistant_id = $2
		`, [courseGroup.id, assistantId]);

		if (isAssistantAssigned.length === 0) {
			throw new BadRequestException('You are not assigned to this course group!');
		}

		// Update attendance record
		const attendance = await this.attendanceRepository.findOne({
			where: {
				studentId: attendanceDto.studentId,
				labSessionId: sessionId
			}
		});

		if (!attendance) {
			throw new NotFoundException('Attendance record not found!');
		}

		attendance.isAttended = attendanceDto.isPresent;

		// Apply absence points if marking as absent
		if (!attendanceDto.isPresent && attendanceDto.absencePoints) {
			attendance.attendancePoints = (attendance.attendancePoints || 0) + attendanceDto.absencePoints;
		}

		await this.attendanceRepository.save(attendance);
	}

	async addStudentToSession(assistantId: UUID, sessionId: UUID, addStudentDto: AddStudentToSessionDto): Promise<void> {
		// Validate session and permissions
		const session = await this.repository.findOneBy({ id: sessionId });
		if (!session) {
			throw new NotFoundException('Session not found!');
		}

		// Validate student exists
		const student = await this.studentRepository.findOneBy({ id: addStudentDto.studentId });
		if (!student) {
			throw new NotFoundException('Student not found!');
		}

		// Check if attendance record already exists
		const existingAttendance = await this.attendanceRepository.findOne({
			where: {
				studentId: addStudentDto.studentId,
				labSessionId: sessionId
			}
		});

		if (existingAttendance) {
			throw new BadRequestException('Student is already in this session!');
		}

		// Create attendance record
		const attendance = this.attendanceRepository.create({
			studentId: addStudentDto.studentId,
			labSessionId: sessionId,
			isAttended: addStudentDto.markAsPresent || false
		});

		await this.attendanceRepository.save(attendance);
	}

	async awardExtraPoints(assistantId: UUID, sessionId: UUID, pointsDto: AwardExtraPointsDto): Promise<void> {
		// Validate session and permissions (similar to takeAttendance)
		const session = await this.repository.findOneBy({ id: sessionId });
		if (!session) {
			throw new NotFoundException('Session not found!');
		}

		const attendance = await this.attendanceRepository.findOne({
			where: {
				studentId: pointsDto.studentId,
				labSessionId: sessionId
			}
		});

		if (!attendance) {
			throw new NotFoundException('Student not found in this session!');
		}

		// Add extra points
		attendance.extraPoints = (attendance.extraPoints || 0) + pointsDto.extraPoints;
		await this.attendanceRepository.save(attendance);
	}
}
