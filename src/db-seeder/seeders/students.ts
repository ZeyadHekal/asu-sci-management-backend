import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { hashSync } from 'bcrypt';
import { User } from 'src/database/users/user.entity';
import { UserType } from 'src/database/users/user-type.entity';
import { Student } from 'src/database/students/student.entity';
import { Course } from 'src/database/courses/course.entity';
import { StudentCourse } from 'src/database/courses/course.entity';
import { Event } from 'src/database/events/event.entity';
import { EventSchedule, StudentEventSchedule, ExamStatus } from 'src/database/events/event_schedules.entity';
import { Lab } from 'src/database/labs/lab.entity';

@Injectable()
export class StudentSeeder {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(UserType) private userTypeRepo: Repository<UserType>,
        @InjectRepository(Student) private studentRepo: Repository<Student>,
        @InjectRepository(Course) private courseRepo: Repository<Course>,
        @InjectRepository(StudentCourse) private studentCourseRepo: Repository<StudentCourse>,
        @InjectRepository(Event) private eventRepo: Repository<Event>,
        @InjectRepository(EventSchedule) private eventScheduleRepo: Repository<EventSchedule>,
        @InjectRepository(StudentEventSchedule) private studentEventScheduleRepo: Repository<StudentEventSchedule>,
        @InjectRepository(Lab) private labRepo: Repository<Lab>,
        private configService: ConfigService,
    ) { }

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

        // Check if test student already exists
        const existingUser = await this.userRepo.findOneBy({ username: 'test_student' });
        if (existingUser) {
            console.log('Test student already exists. Updating event schedule...');
            await this.updateEventSchedule(existingUser);
            return;
        }

        // Create test student user
        const studentUser = this.userRepo.create({
            username: 'test_student',
            name: 'Test Student',
            password: hashSync('Abcd@1234', 10),
            userTypeId: studentUserType.id,
            email: 'test.student@example.com',
        });

        const savedUser = await this.userRepo.save(studentUser);
        console.log('Created test student user: test_student');

        // Create student record
        const student = this.studentRepo.create({
            id: savedUser.id,
            seatNo: 12345,
            level: 2,
            program: 'Computer Science',
            photo: null,
        });

        await this.studentRepo.save(student);
        console.log('Created student record for test_student');

        // Find a practical course (has lab)
        const practicalCourse = await this.courseRepo.findOne({
            where: { hasLab: true },
        });

        if (!practicalCourse) {
            console.warn('No practical course found. Skipping course enrollment.');
            return;
        }

        // Enroll student in the practical course
        const existingEnrollment = await this.studentCourseRepo.findOneBy({
            student_id: savedUser.id,
            course_id: practicalCourse.id,
        });

        if (!existingEnrollment) {
            const studentCourse = this.studentCourseRepo.create({
                student_id: savedUser.id,
                course_id: practicalCourse.id,
            });

            await this.studentCourseRepo.save(studentCourse);
            console.log(`Enrolled test student in course: ${practicalCourse.name}`);
        }

        // Create or update event and schedule
        await this.createEventAndSchedule(practicalCourse, savedUser);
    }

    private async createEventAndSchedule(course: Course, studentUser: User) {
        // Find or create an event for this course
        let event = await this.eventRepo.findOne({
            where: { courseId: course.id, name: 'Test Practical Exam' },
        });

        if (!event) {
            event = this.eventRepo.create({
                name: 'Test Practical Exam',
                duration: 120, // 2 hours
                isExam: true,
                isInLab: true,
                degree: 20,
                autoStart: false,
                examModeStartMinutes: 1, // Start exam mode 1 minute before exam
                description: 'Test practical exam for seeded student',
                courseId: course.id,
            });

            event = await this.eventRepo.save(event);
            console.log(`Created test event: ${event.name}`);
        }

        // Find a lab
        const lab = await this.labRepo.findOne({});
        if (!lab) {
            console.warn('No lab found. Cannot create event schedule.');
            return;
        }

        // Find an assistant (any user that's not a student)
        const assistant = await this.userRepo
            .createQueryBuilder('user')
            .innerJoin('user.userType', 'userType')
            .where('userType.name != :studentType', { studentType: 'Student' })
            .getOne();

        if (!assistant) {
            console.warn('No assistant found. Cannot create event schedule.');
            return;
        }

        // Calculate exam time (1 minute from now)
        const examDateTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now to allow for seeding

        // Delete existing event schedule for this event to avoid duplicates
        await this.eventScheduleRepo.delete({ eventId: event.id });

        // Create event schedule
        const eventSchedule = this.eventScheduleRepo.create({
            eventId: event.id,
            labId: lab.id,
            dateTime: examDateTime,
            assistantId: assistant.id,
            status: ExamStatus.SCHEDULED,
            maxStudents: 30,
            enrolledStudents: 1,
        });

        const savedSchedule = await this.eventScheduleRepo.save(eventSchedule);
        console.log(`Created event schedule for ${examDateTime.toISOString()}`);

        // Delete existing student event schedule to avoid duplicates
        await this.studentEventScheduleRepo.delete({
            eventSchedule_id: savedSchedule.id,
            student_id: studentUser.id,
        });

        // Create student event schedule with marks
        const studentEventSchedule = this.studentEventScheduleRepo.create({
            eventSchedule_id: savedSchedule.id,
            student_id: studentUser.id,
            hasAttended: false,
            mark: 18, // Pre-assigned mark for testing
            seatNo: 'A1',
            isInExamMode: false,
        });

        await this.studentEventScheduleRepo.save(studentEventSchedule);
        console.log('Created student event schedule with marks');
    }

    private async updateEventSchedule(existingUser: User) {
        // Find the student's event schedule and update the exam time
        const studentEventSchedule = await this.studentEventScheduleRepo
            .createQueryBuilder('ses')
            .innerJoin('ses.eventSchedule', 'es')
            .innerJoin('es.event', 'e')
            .where('ses.student_id = :studentId', { studentId: existingUser.id })
            .andWhere('e.name = :eventName', { eventName: 'Test Practical Exam' })
            .getOne();

        if (studentEventSchedule) {
            const eventSchedule = await this.eventScheduleRepo.findOne({
                where: { id: studentEventSchedule.eventSchedule_id },
            });

            if (eventSchedule) {
                // Update exam time to 2 minutes from now
                const newExamDateTime = new Date(Date.now() + 2 * 60 * 1000);
                eventSchedule.dateTime = newExamDateTime;
                eventSchedule.status = ExamStatus.SCHEDULED;

                await this.eventScheduleRepo.save(eventSchedule);
                console.log(`Updated event schedule time to ${newExamDateTime.toISOString()}`);
            }
        }
    }
} 