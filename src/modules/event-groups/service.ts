import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventSchedule, StudentEventSchedule } from 'src/database/events/event_schedules.entity';
import { Event } from 'src/database/events/event.entity';
import { Course } from 'src/database/courses/course.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { Lab } from 'src/database/labs/lab.entity';
import { User } from 'src/database/users/user.entity';
import { UUID } from 'crypto';
import { ApiProperty } from '@nestjs/swagger';
import { MoveStudentBetweenGroupsDto } from '../events/dtos';

export class EventGroupDto {
    @ApiProperty({ description: 'Event group ID' })
    id: UUID;

    @ApiProperty({ description: 'Event ID' })
    eventId: UUID;

    @ApiProperty({ description: 'Event name' })
    eventName: string;

    @ApiProperty({ description: 'Lab name' })
    labName: string;

    @ApiProperty({ description: 'Date and time of the event' })
    dateTime: Date;

    @ApiProperty({ description: 'Maximum number of students' })
    maxStudents: number;

    @ApiProperty({ description: 'Number of enrolled students' })
    enrolledStudents: number;

    @ApiProperty({ description: 'Whether auto-start is enabled' })
    autoStart: boolean;

    @ApiProperty({ description: 'Current status of the event group' })
    status: string;

    @ApiProperty({ description: 'Actual start time', required: false })
    actualStartTime?: Date;

    @ApiProperty({ description: 'Actual end time', required: false })
    actualEndTime?: Date;

    @ApiProperty({ description: 'Exam mode start time', required: false })
    examModeStartTime?: Date;
}

export class EventGroupStudentDto {
    @ApiProperty({ description: 'Student ID' })
    studentId: UUID;

    @ApiProperty({ description: 'Student name' })
    studentName: string;

    @ApiProperty({ description: 'Student username' })
    username: string;

    @ApiProperty({ description: 'Seat number', required: false })
    seatNo?: string;

    @ApiProperty({ description: 'Whether student has attended', required: false })
    hasAttended?: boolean;

    @ApiProperty({ description: 'Whether student is in exam mode' })
    isInExamMode: boolean;

    @ApiProperty({ description: 'When student entered exam mode', required: false })
    examModeEnteredAt?: Date;

    @ApiProperty({ description: 'When exam started for student', required: false })
    examStartedAt?: Date;

    @ApiProperty({ description: 'Student mark', required: false })
    mark?: number;

    @ApiProperty({ description: 'When student submitted', required: false })
    submittedAt?: Date;

    @ApiProperty({ description: 'Assigned exam model URL', required: false })
    assignedExamModelUrl?: string;
}

@Injectable()
export class EventGroupService {
    constructor(
        @InjectRepository(EventSchedule)
        private eventScheduleRepository: Repository<EventSchedule>,
        @InjectRepository(StudentEventSchedule)
        private studentEventScheduleRepository: Repository<StudentEventSchedule>,
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        @InjectRepository(Course)
        private courseRepository: Repository<Course>,
        @InjectRepository(CourseGroup)
        private courseGroupRepository: Repository<CourseGroup>,
        @InjectRepository(Lab)
        private labRepository: Repository<Lab>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    /**
     * Get all event groups for a specific event
     */
    async getEventGroups(eventId: UUID): Promise<EventGroupDto[]> {
        const eventSchedules = await this.eventScheduleRepository
            .createQueryBuilder('es')
            .leftJoinAndSelect('es.event', 'event')
            .leftJoinAndSelect('es.lab', 'lab')
            .where('es.eventId = :eventId', { eventId })
            .orderBy('es.dateTime', 'ASC')
            .getMany();

        return await Promise.all(eventSchedules.map(async schedule => {
            const lab = await (schedule as any).lab;
            return {
                id: schedule.id,
                eventId: schedule.eventId,
                eventName: (schedule as any).event?.name || 'Unknown Event',
                labName: lab.name || 'Lab Not Found',
                dateTime: schedule.dateTime,
                maxStudents: schedule.maxStudents,
                enrolledStudents: schedule.enrolledStudents,
                autoStart: schedule.autoStart,
                status: schedule.status,
                actualStartTime: schedule.actualStartTime,
                actualEndTime: schedule.actualEndTime,
                examModeStartTime: schedule.examModeStartTime,
            };
        }));
    }

    /**
     * Get students in a specific event group
     */
    async getEventGroupStudents(groupId: UUID): Promise<EventGroupStudentDto[]> {
        const studentSchedules = await this.studentEventScheduleRepository
            .createQueryBuilder('ses')
            .leftJoinAndSelect('ses.student', 'student')
            .leftJoin('students', 'studentInfo', 'studentInfo.id = student.id')
            .addSelect(['studentInfo.seatNo'])
            .where('ses.eventSchedule_id = :groupId', { groupId })
            .orderBy('student.name', 'ASC')
            .getMany();

        return studentSchedules.map(ses => ({
            studentId: ses.student_id,
            studentName: (ses.student as any).name,
            username: (ses.student as any).username,
            seatNo: (ses.student as any).seatNo,
            hasAttended: ses.hasAttended,
            isInExamMode: ses.isInExamMode,
            examModeEnteredAt: ses.examModeEnteredAt,
            examStartedAt: ses.examStartedAt,
            mark: ses.mark,
            submittedAt: ses.submittedAt,
            assignedExamModelUrl: ses.assignedExamModelUrl,
        }));
    }

    /**
     * Move student between event groups
     */
    async moveStudentBetweenGroups(moveRequest: MoveStudentBetweenGroupsDto): Promise<{ success: boolean; message: string }> {
        // Check if student exists in the source group
        const sourceEnrollment = await this.studentEventScheduleRepository.findOne({
            where: {
                eventSchedule_id: moveRequest.fromCourseGroupId,
                student_id: moveRequest.studentId,
            },
        });

        if (!sourceEnrollment) {
            throw new BadRequestException('Student is not enrolled in the source group');
        }

        // Check if target group exists and has capacity
        const targetGroup = await this.eventScheduleRepository.findOne({
            where: { id: moveRequest.toCourseGroupId },
        });

        if (!targetGroup) {
            throw new BadRequestException('Target group not found');
        }

        // Check if target group has capacity
        if (targetGroup.enrolledStudents >= targetGroup.maxStudents) {
            throw new BadRequestException(`Target group is at full capacity (${targetGroup.maxStudents})`);
        }

        // Check if student is already in target group
        const existingEnrollment = await this.studentEventScheduleRepository.findOne({
            where: {
                eventSchedule_id: moveRequest.toCourseGroupId,
                student_id: moveRequest.studentId,
            },
        });

        if (existingEnrollment) {
            throw new BadRequestException('Student is already enrolled in the target group');
        }

        // Move the student
        await this.studentEventScheduleRepository.update(
            {
                eventSchedule_id: moveRequest.fromCourseGroupId,
                student_id: moveRequest.studentId,
            },
            {
                eventSchedule_id: moveRequest.toCourseGroupId,
            }
        );

        // Update enrolled student counts
        await this.eventScheduleRepository.decrement(
            { id: moveRequest.fromCourseGroupId },
            'enrolledStudents',
            1
        );
        await this.eventScheduleRepository.increment(
            { id: moveRequest.toCourseGroupId },
            'enrolledStudents',
            1
        );

        return {
            success: true,
            message: 'Student moved successfully between groups',
        };
    }

    /**
     * Start exam for a specific group (manual start)
     */
    async startExamForGroup(groupId: UUID): Promise<{ success: boolean; message: string }> {
        const group = await this.eventScheduleRepository.findOne({
            where: { id: groupId },
        });

        if (!group) {
            throw new NotFoundException('Event group not found');
        }

        // Update group status to started
        await this.eventScheduleRepository.update(groupId, {
            status: 'started' as any,
            actualStartTime: new Date(),
        });

        // Update all students in this group to exam started
        await this.studentEventScheduleRepository.update(
            { eventSchedule_id: groupId },
            {
                examStartedAt: new Date(),
            }
        );

        return {
            success: true,
            message: 'Exam started successfully for the group',
        };
    }

    /**
     * Update autoStart setting for a group
     */
    async updateAutoStart(groupId: UUID, autoStart: boolean): Promise<{ success: boolean; message: string }> {
        const group = await this.eventScheduleRepository.findOne({
            where: { id: groupId },
        });

        if (!group) {
            throw new NotFoundException('Event group not found');
        }

        await this.eventScheduleRepository.update(groupId, { autoStart });

        return {
            success: true,
            message: `Auto-start ${autoStart ? 'enabled' : 'disabled'} for the group`,
        };
    }
} 