import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { hashSync } from 'bcrypt';
import { UUID } from 'crypto';
import { User } from 'src/database/users/user.entity';
import { UserType } from 'src/database/users/user-type.entity';
import { Student } from 'src/database/students/student.entity';
import { Course } from 'src/database/courses/course.entity';
import { StudentCourses } from 'src/database/students/student_courses.entity';
import { Event, EventType, LocationType } from 'src/database/events/event.entity';
import { EventSchedule, StudentEventSchedule, ExamStatus } from 'src/database/events/event_schedules.entity';
import { Lab } from 'src/database/labs/lab.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { ExamModel } from 'src/database/events/exam-models.entity';
import { File } from 'src/modules/files/entities/file.entity';

interface StudentTestCase {
    username: string;
    name: string;
    email: string;
    seatNo: number;
    level: number;
    program: string;
    scenario: string;
    description: string;
}

@Injectable()
export class StudentSeeder {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(UserType) private userTypeRepo: Repository<UserType>,
        @InjectRepository(Student) private studentRepo: Repository<Student>,
        @InjectRepository(Course) private courseRepo: Repository<Course>,
        @InjectRepository(StudentCourses) private studentCourseRepo: Repository<StudentCourses>,
        @InjectRepository(Event) private eventRepo: Repository<Event>,
        @InjectRepository(EventSchedule) private eventScheduleRepo: Repository<EventSchedule>,
        @InjectRepository(StudentEventSchedule) private studentEventScheduleRepo: Repository<StudentEventSchedule>,
        @InjectRepository(Lab) private labRepo: Repository<Lab>,
        @InjectRepository(CourseGroup) private courseGroupRepo: Repository<CourseGroup>,
        @InjectRepository(ExamModel) private examModelRepo: Repository<ExamModel>,
        @InjectRepository(File) private fileRepo: Repository<File>,
        private configService: ConfigService,
    ) { }

    // Test cases for different student scenarios
    private getStudentTestCases(): StudentTestCase[] {
        return [
            {
                username: 'student_default',
                name: 'Ahmed Default Student',
                email: 'ahmed.default@student.edu',
                seatNo: 20240001,
                level: 2,
                program: 'Computer Science',
                scenario: 'default_group',
                description: 'Student assigned to default groups only'
            },
            {
                username: 'student_with_lab',
                name: 'Sara Lab Student',
                email: 'sara.lab@student.edu',
                seatNo: 20240002,
                level: 2,
                program: 'Computer Science',
                scenario: 'lab_with_content',
                description: 'Student in group connected to lab with course content, no exam'
            },
            {
                username: 'student_exam_soon',
                name: 'Mohamed Exam Soon',
                email: 'mohamed.examsoon@student.edu',
                seatNo: 20240003,
                level: 2,
                program: 'Computer Science',
                scenario: 'exam_starting_soon',
                description: 'Student with exam starting in 10 mins (exam mode active)'
            },
            {
                username: 'student_exam_active',
                name: 'Fatma Active Exam',
                email: 'fatma.activeexam@student.edu',
                seatNo: 20240004,
                level: 2,
                program: 'Computer Science',
                scenario: 'exam_active',
                description: 'Student in active exam (can see files and submit)'
            },
            {
                username: 'student_exam_ended',
                name: 'Ali Exam Ended',
                email: 'ali.examended@student.edu',
                seatNo: 20240005,
                level: 2,
                program: 'Computer Science',
                scenario: 'exam_ended',
                description: 'Student with recently ended exam'
            },
            {
                username: 'student_multiple_exams',
                name: 'Nour Multiple Exams',
                email: 'nour.multiexams@student.edu',
                seatNo: 20240006,
                level: 2,
                program: 'Computer Science',
                scenario: 'multiple_exams',
                description: 'Student with multiple exam schedules (past, current, future)'
            }
        ];
    }

    public async seed() {
        const createDefaultUsers = this.configService.get<string>('CREATE_DEFAULT_USERS') === 'true';

        if (!createDefaultUsers) {
            console.log('Skipping student seeder as CREATE_DEFAULT_USERS is not true');
            return;
        }

        // Find Student user type
        const studentUserType = await this.userTypeRepo.findOneBy({ name: 'Student' });
        if (!studentUserType) {
            console.warn('Student user type not found. Skipping student seeder.');
            return;
        }

        // Get required data for seeding
        const labs = await this.labRepo.find();
        const courses = await this.courseRepo.find({ take: 10 });
        const assistants = await this.userRepo
            .createQueryBuilder('user')
            .innerJoin('user.userType', 'userType')
            .where('userType.name != :studentType', { studentType: 'Student' })
            .getMany();

        if (labs.length === 0 || courses.length === 0 || assistants.length === 0) {
            console.warn('Missing required data (labs/courses/assistants). Skipping student seeder.');
            return;
        }

        // Create sample files first for exam models
        await this.createSampleFiles();

        const testCases = this.getStudentTestCases();

        for (const testCase of testCases) {
            await this.createStudentWithScenario(testCase, studentUserType, labs, courses, assistants);
        }

        console.log('✅ Student seeder completed with time-relative test scenarios (all relative to current time)');
        console.log('🕐 Scenarios created:');
        console.log('   📋 Default student: Basic course enrollments');
        console.log('   🧪 Lab student: Course with lab content');
        console.log('   ⏰ Exam soon: Exam starting in 10 minutes (exam mode active)');
        console.log('   🟢 Active exam: Exam running for 30 minutes');
        console.log('   ✅ Exam ended: Exam finished 30 minutes ago');
        console.log('   📊 Multiple exams: Past, current, and future exams');
    }

    private async createStudentWithScenario(
        testCase: StudentTestCase,
        studentUserType: UserType,
        labs: Lab[],
        courses: Course[],
        assistants: User[]
    ) {
        // Check if student already exists
        const existingUser = await this.userRepo.findOneBy({ username: testCase.username });
        if (existingUser) {
            console.log(`${testCase.username} already exists - updating scenario`);
            await this.updateStudentScenario(existingUser, testCase, labs, courses, assistants);
            return;
        }

        // Create user
        const studentUser = this.userRepo.create({
            username: testCase.username,
            name: testCase.name,
            password: hashSync('Abcd@1234', 10),
            userTypeId: studentUserType.id,
            email: testCase.email,
        });

        const savedUser = await this.userRepo.save(studentUser);
        console.log(`Created student user: ${testCase.username}`);

        // Create student record
        const student = this.studentRepo.create({
            id: savedUser.id,
            seatNo: testCase.seatNo,
            level: testCase.level,
            program: testCase.program,
            photo: null,
        });

        const savedStudent = await this.studentRepo.save(student);
        console.log(`Created student record for ${testCase.username} with ID: ${savedStudent.id}`);

        // Ensure all entities are properly saved before creating relationships
        if (!savedStudent) {
            throw new Error(`Failed to create student record for ${testCase.username}`);
        }

        // Verify student exists before applying scenarios
        const verifyStudent = await this.studentRepo.findOneBy({ id: savedUser.id });
        if (!verifyStudent) {
            throw new Error(`Student record not found after creation for ${testCase.username}`);
        }
        console.log(`✓ Verified student ${testCase.username} exists in database`);

        // Apply specific scenario
        await this.applyStudentScenario(savedUser, testCase, labs, courses, assistants);
    }

    private async updateStudentScenario(
        existingUser: User,
        testCase: StudentTestCase,
        labs: Lab[],
        courses: Course[],
        assistants: User[]
    ) {
        console.log(`🔄 Updating ${testCase.username} with fresh time-relative scenario: ${testCase.scenario}`);

        // Clean up existing data for fresh scenario
        await this.cleanupStudentData(existingUser.id);

        // Apply the scenario with current time calculations
        await this.applyStudentScenario(existingUser, testCase, labs, courses, assistants);

        console.log(`✨ ${testCase.username} scenario updated successfully`);
    }

    private async cleanupStudentData(studentId: string) {
        try {
            // Get all event schedules for this student
            const studentEventSchedules = await this.studentEventScheduleRepo.find({
                where: { student_id: studentId as any }
            });

            // Get the event schedule IDs
            const eventScheduleIds = studentEventSchedules.map(ses => ses.eventSchedule_id);

            // Remove student event schedules first
            await this.studentEventScheduleRepo.delete({ student_id: studentId as any });

            // Remove event schedules and their associated events if they're not used by other students
            for (const eventScheduleId of eventScheduleIds) {
                // Check if this event schedule is used by other students
                const otherStudentSchedules = await this.studentEventScheduleRepo.count({
                    where: { eventSchedule_id: eventScheduleId }
                });

                if (otherStudentSchedules === 0) {
                    // Get the event schedule to find the associated event
                    const eventSchedule = await this.eventScheduleRepo.findOne({
                        where: { id: eventScheduleId },
                        relations: ['event']
                    });

                    if (eventSchedule) {
                        const event = await eventSchedule.event;

                        // Delete the event schedule
                        await this.eventScheduleRepo.delete({ id: eventScheduleId });

                        // Check if the event is used by other schedules
                        const otherEventSchedules = await this.eventScheduleRepo.count({
                            where: { eventId: event.id }
                        });

                        if (otherEventSchedules === 0) {
                            // Delete the event if it's not used by other schedules
                            await this.eventRepo.delete({ id: event.id });
                            console.log(`🗑️ Removed orphaned event: ${event.name}`);
                        }
                    }
                }
            }

            // Remove existing course enrollments
            await this.studentCourseRepo.delete({ studentId: studentId as any });

            console.log(`🧹 Cleaned up existing data for student ${studentId}`);
        } catch (error) {
            console.error(`❌ Error cleaning up data for student ${studentId}:`, error);
            throw error;
        }
    }

    private async applyStudentScenario(
        studentUser: User,
        testCase: StudentTestCase,
        labs: Lab[],
        courses: Course[],
        assistants: User[]
    ) {
        switch (testCase.scenario) {
            case 'default_group':
                await this.setupDefaultGroupScenario(studentUser, courses);
                break;
            case 'lab_with_content':
                await this.setupLabWithContentScenario(studentUser, labs, courses);
                break;
            case 'exam_starting_soon':
                await this.setupExamStartingSoonScenario(studentUser, labs, courses, assistants);
                break;
            case 'exam_active':
                await this.setupActiveExamScenario(studentUser, labs, courses, assistants);
                break;
            case 'exam_ended':
                await this.setupEndedExamScenario(studentUser, labs, courses, assistants);
                break;
            case 'multiple_exams':
                await this.setupMultipleExamsScenario(studentUser, labs, courses, assistants);
                break;
        }

        console.log(`✓ Applied scenario '${testCase.scenario}' for ${testCase.username}: ${testCase.description}`);
    }

    // Scenario 1: Student assigned to default groups only
    private async setupDefaultGroupScenario(studentUser: User, courses: Course[]) {
        const selectedCourses = courses.slice(0, 3);

        for (const course of selectedCourses) {
            // Find or create default group using helper method
            const defaultGroup = await this.findOrCreateCourseGroup(course, true);

            // Enroll student in default group
            try {
                // Verify foreign key references exist before creating enrollment
                const studentExists = await this.studentRepo.findOneBy({ id: studentUser.id });
                if (!studentExists) {
                    throw new Error(`Student ${studentUser.username} not found in students table`);
                }

                console.log(`Attempting to enroll student ${studentUser.username} (${studentUser.id}) in course ${course.name} (${course.id})`);

                const enrollment = this.studentCourseRepo.create({
                    studentId: studentUser.id,
                    courseId: course.id,
                    courseGroupId: defaultGroup.id,
                    groupNumber: defaultGroup.order
                });
                await this.studentCourseRepo.save(enrollment);
                console.log(`✓ Enrolled ${studentUser.username} in course ${course.name}`);
            } catch (error) {
                console.error(`✗ Failed to enroll ${studentUser.username} in course ${course.name}:`, error.message);
                console.error(`Error details:`, error);
                throw error;
            }
        }
    }

    // Scenario 2: Student in group connected to lab with course content, no exam
    private async setupLabWithContentScenario(studentUser: User, labs: Lab[], courses: Course[]) {
        const practicalCourses = courses.filter(c => c.hasLab).slice(0, 2);
        const theoreticalCourses = courses.filter(c => !c.hasLab).slice(0, 2);

        // Enroll in practical courses with lab groups
        for (const course of practicalCourses) {
            const lab = labs[0]; // Use first available lab

            // Create a group connected to a lab using helper method
            const labGroup = await this.findOrCreateCourseGroup(course, false, lab.id);

            // Enroll student
            try {
                const enrollment = this.studentCourseRepo.create({
                    studentId: studentUser.id,
                    courseId: course.id,
                    courseGroupId: labGroup.id,
                    groupNumber: labGroup.order
                });
                await this.studentCourseRepo.save(enrollment);
                console.log(`✓ Enrolled ${studentUser.username} in lab course ${course.name}`);
            } catch (error) {
                console.error(`✗ Failed to enroll ${studentUser.username} in lab course ${course.name}:`, error.message);
                throw error;
            }
        }

        // Enroll in theoretical courses (default groups)
        for (const course of theoreticalCourses) {
            const defaultGroup = await this.findOrCreateCourseGroup(course, true);

            try {
                const enrollment = this.studentCourseRepo.create({
                    studentId: studentUser.id,
                    courseId: course.id,
                    courseGroupId: defaultGroup.id,
                    groupNumber: defaultGroup.order
                });
                await this.studentCourseRepo.save(enrollment);
                console.log(`✓ Enrolled ${studentUser.username} in theoretical course ${course.name}`);
            } catch (error) {
                console.error(`✗ Failed to enroll ${studentUser.username} in theoretical course ${course.name}:`, error.message);
                throw error;
            }
        }
    }

    // Scenario 3: Student with exam starting in 10 mins (exam mode should be active)
    private async setupExamStartingSoonScenario(studentUser: User, labs: Lab[], courses: Course[], assistants: User[]) {
        const course = courses.find(c => c.hasLab) || courses[0];
        const lab = labs[0];
        const assistant = assistants[0];

        // Enroll student in course
        await this.enrollStudentInCourse(studentUser, course, lab);

        // Create exam schedule starting in 10 minutes from NOW
        const now = new Date();
        const examDateTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

        // Create exam event with proper startDateTime
        const event = await this.createExamEvent(course, 'Upcoming Practical Exam', 120, examDateTime);

        const eventSchedule = await this.createEventSchedule(event, lab, assistant, examDateTime, ExamStatus.EXAM_MODE_ACTIVE);

        // Update the schedule to show it entered exam mode 20 minutes ago (30 min before exam - 10 min until exam)
        const examModeStartTime = new Date(examDateTime.getTime() - 30 * 60 * 1000);
        await this.eventScheduleRepo.update(eventSchedule.id, {
            examModeStartTime: examModeStartTime,
            status: ExamStatus.EXAM_MODE_ACTIVE
        });

        // Create student event schedule (exam mode should be active)
        const studentEventSchedule = this.studentEventScheduleRepo.create({
            eventSchedule_id: eventSchedule.id,
            student_id: studentUser.id,
            hasAttended: false,
            mark: null,
            seatNo: 'A1',
            isInExamMode: true, // Student is in exam mode waiting for exam to start
            examModeEnteredAt: examModeStartTime
        });
        await this.studentEventScheduleRepo.save(studentEventSchedule);

        console.log(`⏰ Created 'exam starting soon' scenario - Exam at ${examDateTime.toLocaleTimeString()}, Mode active since ${examModeStartTime.toLocaleTimeString()}`);
    }

    // Scenario 4: Student in active exam (can see files and submit)
    private async setupActiveExamScenario(studentUser: User, labs: Lab[], courses: Course[], assistants: User[]) {
        const course = courses.find(c => c.hasLab) || courses[0];
        const lab = labs[0];
        const assistant = assistants[0];

        // Enroll student in course
        await this.enrollStudentInCourse(studentUser, course, lab);

        // Create exam schedule that started 30 minutes ago from NOW
        const now = new Date();
        const examDateTime = new Date(now.getTime() - 30 * 60 * 1000); // Started 30 minutes ago

        // Create exam event with proper startDateTime
        const event = await this.createExamEvent(course, 'Active Practical Exam', 120, examDateTime);

        const eventSchedule = await this.createEventSchedule(event, lab, assistant, examDateTime, ExamStatus.STARTED);

        // Update the schedule with actual start time and exam mode start time
        const examModeStartTime = new Date(examDateTime.getTime() - 30 * 60 * 1000);
        await this.eventScheduleRepo.update(eventSchedule.id, {
            actualStartTime: examDateTime,
            examModeStartTime: examModeStartTime,
            status: ExamStatus.STARTED
        });

        // Create student event schedule in active exam
        const studentEventSchedule = this.studentEventScheduleRepo.create({
            eventSchedule_id: eventSchedule.id,
            student_id: studentUser.id,
            hasAttended: true,
            mark: null,
            seatNo: 'A2',
            isInExamMode: true,
            examModeEnteredAt: examModeStartTime,
            examStartedAt: examDateTime
        });
        await this.studentEventScheduleRepo.save(studentEventSchedule);

        console.log(`🟢 Created 'active exam' scenario - Exam started at ${examDateTime.toLocaleTimeString()}, running for ${Math.round((now.getTime() - examDateTime.getTime()) / (1000 * 60))} minutes`);
    }

    // Scenario 5: Student with recently ended exam
    private async setupEndedExamScenario(studentUser: User, labs: Lab[], courses: Course[], assistants: User[]) {
        const course = courses.find(c => c.hasLab) || courses[0];
        const lab = labs[0];
        const assistant = assistants[0];

        // Enroll student in course
        await this.enrollStudentInCourse(studentUser, course, lab);

        // Create exam schedule that ended 30 minutes ago from NOW
        const now = new Date();
        const examEndTime = new Date(now.getTime() - 30 * 60 * 1000); // Ended 30 minutes ago
        const examDateTime = new Date(examEndTime.getTime() - 120 * 60 * 1000); // Started 2.5 hours ago (120 min duration)

        // Create exam event with proper startDateTime
        const event = await this.createExamEvent(course, 'Completed Practical Exam', 120, examDateTime);

        const eventSchedule = await this.createEventSchedule(event, lab, assistant, examDateTime, ExamStatus.ENDED);

        // Update the schedule with proper timestamps
        const examModeStartTime = new Date(examDateTime.getTime() - 30 * 60 * 1000);
        await this.eventScheduleRepo.update(eventSchedule.id, {
            actualStartTime: examDateTime,
            actualEndTime: examEndTime,
            examModeStartTime: examModeStartTime,
            status: ExamStatus.ENDED
        });

        // Create student event schedule with final mark
        const studentEventSchedule = this.studentEventScheduleRepo.create({
            eventSchedule_id: eventSchedule.id,
            student_id: studentUser.id,
            hasAttended: true,
            mark: 85, // Final mark
            seatNo: 'A3',
            isInExamMode: false,
            examModeEnteredAt: examModeStartTime,
            examStartedAt: examDateTime,
            submittedAt: examEndTime
        });
        await this.studentEventScheduleRepo.save(studentEventSchedule);

        console.log(`✅ Created 'exam ended' scenario - Exam ran from ${examDateTime.toLocaleTimeString()} to ${examEndTime.toLocaleTimeString()}, ended ${Math.round((now.getTime() - examEndTime.getTime()) / (1000 * 60))} minutes ago`);
    }

    // Scenario 6: Student with multiple exam schedules (past, current, future)
    private async setupMultipleExamsScenario(studentUser: User, labs: Lab[], courses: Course[], assistants: User[]) {
        const selectedCourses = courses.filter(c => c.hasLab).slice(0, 3);
        const lab = labs[0];
        const assistant = assistants[0];
        const now = new Date();

        for (let i = 0; i < selectedCourses.length; i++) {
            const course = selectedCourses[i];

            // Enroll student in course
            await this.enrollStudentInCourse(studentUser, course, lab);

            let examDateTime: Date;
            let examEndTime: Date | null = null;
            let examModeStartTime: Date;
            let status: ExamStatus;
            let mark: number | null = null;
            let hasAttended = false;
            let isInExamMode = false;
            let examStartedAt: Date | null = null;
            let submittedAt: Date | null = null;

            // Create different exam timings based on current time
            switch (i) {
                case 0: // Past exam (completed)
                    examEndTime = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // Ended 5 days ago
                    examDateTime = new Date(examEndTime.getTime() - 90 * 60 * 1000); // Started 90 min before end
                    examModeStartTime = new Date(examDateTime.getTime() - 30 * 60 * 1000);
                    status = ExamStatus.ENDED;
                    mark = 78;
                    hasAttended = true;
                    examStartedAt = examDateTime;
                    submittedAt = examEndTime;
                    break;
                case 1: // Current exam (in progress)
                    examDateTime = new Date(now.getTime() - 45 * 60 * 1000); // Started 45 minutes ago
                    examModeStartTime = new Date(examDateTime.getTime() - 30 * 60 * 1000);
                    status = ExamStatus.STARTED;
                    hasAttended = true;
                    isInExamMode = true;
                    examStartedAt = examDateTime;
                    break;
                case 2: // Future exam (scheduled)
                    examDateTime = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
                    examModeStartTime = new Date(examDateTime.getTime() - 30 * 60 * 1000);
                    status = ExamStatus.SCHEDULED;
                    break;
            }

            // Create exam event with proper startDateTime
            const event = await this.createExamEvent(course, `${course.name} Exam`, 90, examDateTime);

            const eventSchedule = await this.createEventSchedule(event, lab, assistant, examDateTime, status);

            // Update the schedule with proper timestamps
            const updateData: any = {
                examModeStartTime: examModeStartTime,
                status: status
            };

            if (examStartedAt) updateData.actualStartTime = examStartedAt;
            if (examEndTime) updateData.actualEndTime = examEndTime;

            await this.eventScheduleRepo.update(eventSchedule.id, updateData);

            // Create student event schedule
            const studentEventSchedule = this.studentEventScheduleRepo.create({
                eventSchedule_id: eventSchedule.id,
                student_id: studentUser.id,
                hasAttended,
                mark,
                seatNo: `A${i + 4}`,
                isInExamMode,
                examModeEnteredAt: examModeStartTime,
                examStartedAt: examStartedAt,
                submittedAt: submittedAt
            });
            await this.studentEventScheduleRepo.save(studentEventSchedule);

            // Log scenario details
            const scenarioNames = ['Past (Completed)', 'Current (Active)', 'Future (Scheduled)'];
            console.log(`📊 Multiple exams - ${scenarioNames[i]}: ${course.name} exam at ${examDateTime.toLocaleTimeString()}`);
        }

        console.log(`🔢 Created 'multiple exams' scenario with 3 different exam states`);
    }

    // Helper methods
    private async findOrCreateCourseGroup(course: Course, isDefault: boolean, labId?: UUID): Promise<CourseGroup> {
        // First try to find existing group
        if (isDefault) {
            const existingGroup = await this.courseGroupRepo.findOne({
                where: { courseId: course.id as any, isDefault: true }
            });
            if (existingGroup) {
                return existingGroup;
            }
        } else if (labId) {
            const existingGroup = await this.courseGroupRepo.findOne({
                where: { courseId: course.id as any, labId: labId as any }
            });
            if (existingGroup) {
                return existingGroup;
            }
        }

        let order: number;
        if (isDefault) {
            // Default groups always have order 999 for lowest priority
            order = 999;
        } else {
            // For non-default groups, get the next available order
            const maxOrderResult = await this.courseGroupRepo
                .createQueryBuilder('courseGroup')
                .select('MAX(courseGroup.order)', 'maxOrder')
                .where('courseGroup.courseId = :courseId', { courseId: course.id })
                .andWhere('courseGroup.isDefault = false') // Exclude default group from max calculation
                .getRawOne();

            order = (maxOrderResult?.maxOrder || 0) + 1;
        }

        // Create new group
        const newGroup = this.courseGroupRepo.create({
            courseId: course.id as any,
            order: order,
            isDefault: isDefault,
            labId: labId as any || null,
            capacity: isDefault ? 50 : 30
        });

        const savedGroup = await this.courseGroupRepo.save(newGroup);
        const groupType = isDefault ? 'default' : 'lab';
        console.log(`Created ${groupType} group for course ${course.name} with order ${order}`);

        return savedGroup;
    }

    private async enrollStudentInCourse(studentUser: User, course: Course, lab: Lab) {
        // Create or find lab group for course using helper method
        const labGroup = await this.findOrCreateCourseGroup(course, false, lab.id);

        // Enroll student
        try {
            const enrollment = this.studentCourseRepo.create({
                studentId: studentUser.id,
                courseId: course.id,
                courseGroupId: labGroup.id,
                groupNumber: labGroup.order
            });
            await this.studentCourseRepo.save(enrollment);
            console.log(`✓ Enrolled ${studentUser.username} in course ${course.name} (${labGroup.id})`);
        } catch (error) {
            console.error(`✗ Failed to enroll ${studentUser.username} in course ${course.name}:`, error.message);
            throw error;
        }
    }

    private async createExamEvent(course: Course, eventName: string, duration: number, startDateTime?: Date): Promise<Event> {
        // Check if event already exists
        let event = await this.eventRepo.findOne({
            where: { courseId: course.id, name: eventName }
        });

        if (!event) {
            // Use provided startDateTime or default to 24 hours from now
            const defaultStartTime = startDateTime || new Date(Date.now() + 24 * 60 * 60 * 1000);

            // Randomly choose location type for variety
            const locationTypes = [LocationType.LAB_DEVICES, LocationType.LECTURE_HALL, LocationType.ONLINE];
            const randomLocationType = locationTypes[Math.floor(Math.random() * locationTypes.length)];
            const isLabEvent = randomLocationType === LocationType.LAB_DEVICES;

            event = this.eventRepo.create({
                name: eventName,
                duration: duration,
                eventType: EventType.EXAM,
                locationType: randomLocationType,
                customLocation: randomLocationType !== LocationType.LAB_DEVICES ?
                    (randomLocationType === LocationType.ONLINE ? 'Zoom Meeting Room' : 'Main Lecture Hall A') :
                    undefined,
                hasMarks: true,
                totalMarks: 20,
                autoStart: Math.random() > 0.5, // Randomly assign auto-start
                requiresModels: isLabEvent && Math.random() > 0.3, // Only lab events can require models, 70% chance
                examModeStartMinutes: 30, // Exam mode starts 30 minutes before exam
                startDateTime: defaultStartTime,
                description: `Test exam for course ${course.name}`,
                courseId: course.id,
            });
            event = await this.eventRepo.save(event);
            console.log(`📝 Created exam event "${eventName}" with startDateTime: ${defaultStartTime.toISOString()}`);

            // Create exam models if the event requires them
            await this.createExamModelsFromFiles(event);
        }

        return event;
    }

    private async createEventSchedule(event: Event, lab: Lab, assistant: User, examDateTime: Date, status: ExamStatus): Promise<EventSchedule> {
        // Delete existing schedule for this event to avoid duplicates
        await this.eventScheduleRepo.delete({ eventId: event.id });

        const eventSchedule = this.eventScheduleRepo.create({
            eventId: event.id,
            labId: lab.id,
            dateTime: examDateTime,
            assistantId: assistant.id,
            status: status,
            maxStudents: 30,
            enrolledStudents: 1,
        });

        return await this.eventScheduleRepo.save(eventSchedule);
    }

    private async createExamModelsFromFiles(event: Event): Promise<void> {
        // Only create exam models if the event requires them
        if (!event.requiresModels) {
            return;
        }

        try {
            // Get random files from the files table (limit to first 5 for variety)
            let availableFiles = await this.fileRepo.find({
                take: 10,
                where: {
                    mimetype: 'application/pdf' // Prefer PDF files for exam models
                }
            });

            // If no PDF files, get any files
            if (availableFiles.length === 0) {
                availableFiles = await this.fileRepo.find({ take: 10 });
            }

            // If still no files, create some sample files for testing
            if (availableFiles.length === 0) {
                await this.createSampleFiles();
                availableFiles = await this.fileRepo.find({ take: 5 });
            }

            if (availableFiles.length === 0) {
                console.log(`⚠ No files found for exam models in event "${event.name}"`);
                return;
            }

            // Create 2-3 exam models per event
            const numModels = Math.min(Math.floor(Math.random() * 2) + 2, availableFiles.length);
            const selectedFiles = availableFiles.slice(0, numModels);

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];

                const examModel = this.examModelRepo.create({
                    name: `Model ${String.fromCharCode(65 + i)}`, // Model A, Model B, etc.
                    version: String.fromCharCode(65 + i), // A, B, C, etc.
                    description: `Exam model ${String.fromCharCode(65 + i)} for ${event.name}`,
                    assignedStudentCount: 0,
                    isActive: true,
                    eventId: event.id,
                });

                await this.examModelRepo.save(examModel);
                console.log(`📄 Created exam model "${examModel.name}" for event "${event.name}"`);
            }

            console.log(`✅ Created ${selectedFiles.length} exam models for event "${event.name}"`);
        } catch (error) {
            console.error(`❌ Failed to create exam models for event "${event.name}":`, error.message);
        }
    }

    private async createSampleFiles(): Promise<void> {
        const sampleFiles = [
            {
                filename: 'sample_exam_1.pdf',
                originalname: 'Computer Science Exam Model A.pdf',
                mimetype: 'application/pdf',
                size: 1024000, // 1MB
                objectName: 'exams/sample_exam_1.pdf',
                prefix: 'exams',
                bucket: 'exam-files',
                isPublic: false
            },
            {
                filename: 'sample_exam_2.pdf',
                originalname: 'Computer Science Exam Model B.pdf',
                mimetype: 'application/pdf',
                size: 1156000, // 1.1MB
                objectName: 'exams/sample_exam_2.pdf',
                prefix: 'exams',
                bucket: 'exam-files',
                isPublic: false
            },
            {
                filename: 'sample_exam_3.pdf',
                originalname: 'Programming Quiz Template.pdf',
                mimetype: 'application/pdf',
                size: 856000, // 850KB
                objectName: 'exams/sample_exam_3.pdf',
                prefix: 'exams',
                bucket: 'exam-files',
                isPublic: false
            }
        ];

        try {
            for (const fileData of sampleFiles) {
                const existingFile = await this.fileRepo.findOne({
                    where: { filename: fileData.filename }
                });

                if (!existingFile) {
                    const file = this.fileRepo.create(fileData);
                    await this.fileRepo.save(file);
                    console.log(`📁 Created sample file: ${fileData.originalname}`);
                }
            }
        } catch (error) {
            console.error('❌ Failed to create sample files:', error.message);
        }
    }
} 