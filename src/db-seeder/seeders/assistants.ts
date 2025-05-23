import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/users/user.entity';
import { UserType } from 'src/database/users/user-type.entity';
import { UserPrivilege, Privilege } from 'src/database/privileges/privilege.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { CourseGroupSchedule } from 'src/database/courses/course_labs.entity';
import { Course } from 'src/database/courses/course.entity';
import { PrivilegeCode } from '../data/privileges';
import * as bcrypt from 'bcrypt';

export interface AssistantConfig {
    username: string;
    email: string;
    name: string;
    department: string;
}

export const ASSISTANTS_CONFIG: AssistantConfig[] = [
    {
        username: 'ahmed.hassan',
        email: 'ahmed.hassan@university.edu',
        name: 'Ahmed Hassan',
        department: 'Computer Science',
    },
    {
        username: 'fatima.ali',
        email: 'fatima.ali@university.edu',
        name: 'Fatima Ali',
        department: 'Computer Science',
    },
    {
        username: 'omar.mahmoud',
        email: 'omar.mahmoud@university.edu',
        name: 'Omar Mahmoud',
        department: 'Computer Science',
    },
    {
        username: 'sara.ibrahim',
        email: 'sara.ibrahim@university.edu',
        name: 'Sara Ibrahim',
        department: 'Computer Science',
    },
    {
        username: 'youssef.abdel',
        email: 'youssef.abdel@university.edu',
        name: 'Youssef Abdel Rahman',
        department: 'Computer Science',
    },
];

@Injectable()
export class AssistantSeeder {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(UserType) private userTypeRepo: Repository<UserType>,
        @InjectRepository(UserPrivilege) private userPrivilegeRepo: Repository<UserPrivilege>,
        @InjectRepository(Privilege) private privilegeRepo: Repository<Privilege>,
        @InjectRepository(CourseGroup) private courseGroupRepo: Repository<CourseGroup>,
        @InjectRepository(CourseGroupSchedule) private courseGroupScheduleRepo: Repository<CourseGroupSchedule>,
        @InjectRepository(Course) private courseRepo: Repository<Course>,
    ) { }

    public async seed() {
        // Find the Lab Admin user type (or create it if needed)
        let labAdminType = await this.userTypeRepo.findOneBy({ name: 'Lab Admin' });
        if (!labAdminType) {
            console.log('Lab Admin user type not found, creating it...');
            labAdminType = this.userTypeRepo.create({
                name: 'Lab Admin',
                description: 'Lab assistant with equipment management capabilities',
                isDeletable: true,
            });
            labAdminType = await this.userTypeRepo.save(labAdminType);
        }

        // Find the LAB_ASSISTANT privilege
        const labAssistantPrivilege = await this.privilegeRepo.findOneBy({ code: PrivilegeCode.LAB_ASSISTANT });
        if (!labAssistantPrivilege) {
            console.warn('LAB_ASSISTANT privilege not found, skipping assistant creation');
            return;
        }

        // Find the ASSIST_IN_COURSE privilege
        const assistInCoursePrivilege = await this.privilegeRepo.findOneBy({ code: PrivilegeCode.ASSIST_IN_COURSE });
        if (!assistInCoursePrivilege) {
            console.warn('ASSIST_IN_COURSE privilege not found, assistants won\'t be able to assist in courses');
        }

        const createdAssistants: User[] = [];

        for (const assistantConfig of ASSISTANTS_CONFIG) {
            // Check if assistant already exists
            const existingAssistant = await this.userRepo.findOneBy({ username: assistantConfig.username });

            if (existingAssistant) {
                console.log(`Assistant ${assistantConfig.username} already exists, adding to created list for group assignment`);
                createdAssistants.push(existingAssistant);
                continue;
            }

            // Create the assistant user
            const hashedPassword = await bcrypt.hash('assistant123', 10); // Default password
            const assistant = this.userRepo.create({
                username: assistantConfig.username,
                email: assistantConfig.email,
                name: assistantConfig.name,
                password: hashedPassword,
                department: assistantConfig.department,
                userTypeId: labAdminType.id,
                status: true,
            });

            const savedAssistant = await this.userRepo.save(assistant);
            createdAssistants.push(savedAssistant);

            // Assign LAB_ASSISTANT privilege
            const userPrivilege = this.userPrivilegeRepo.create({
                user_id: savedAssistant.id,
                privilege_id: labAssistantPrivilege.id,
                resourceIds: null, // Access to all resources
            });

            await this.userPrivilegeRepo.save(userPrivilege);

            // Assign ASSIST_IN_COURSE privilege if available
            if (assistInCoursePrivilege) {
                const assistPrivilege = this.userPrivilegeRepo.create({
                    user_id: savedAssistant.id,
                    privilege_id: assistInCoursePrivilege.id,
                    resourceIds: null, // Access to all courses
                });

                await this.userPrivilegeRepo.save(assistPrivilege);
            }

            console.log(`Created assistant: ${assistantConfig.name} (${assistantConfig.username})`);
        }

        // Assign assistants to course groups
        await this.assignAssistantsToGroups(createdAssistants);

        console.log('Assistant seeding completed');
    }

    private async assignAssistantsToGroups(assistants: User[]): Promise<void> {
        if (assistants.length === 0) {
            console.log('No assistants available for group assignment');
            return;
        }

        // Get all non-default course groups (only practical courses with labs)
        const courseGroups = await this.courseGroupRepo
            .createQueryBuilder('courseGroup')
            .leftJoinAndSelect('courseGroup.course', 'course')
            .where('courseGroup.isDefault = false')
            .andWhere('courseGroup.labId IS NOT NULL')
            .orderBy('course.name', 'ASC')
            .addOrderBy('courseGroup.order', 'ASC')
            .getMany();

        if (courseGroups.length === 0) {
            console.log('No lab course groups found for assistant assignment');
            return;
        }

        console.log(`Found ${courseGroups.length} lab course groups for assistant assignment`);

        // Define common lab schedule patterns
        const schedulePatterns = [
            { weekDay: 'Monday', startTime: '08:00', endTime: '11:00' },
            { weekDay: 'Monday', startTime: '12:00', endTime: '15:00' },
            { weekDay: 'Tuesday', startTime: '08:00', endTime: '11:00' },
            { weekDay: 'Tuesday', startTime: '12:00', endTime: '15:00' },
            { weekDay: 'Wednesday', startTime: '08:00', endTime: '11:00' },
            { weekDay: 'Wednesday', startTime: '12:00', endTime: '15:00' },
            { weekDay: 'Thursday', startTime: '08:00', endTime: '11:00' },
            { weekDay: 'Thursday', startTime: '12:00', endTime: '15:00' },
        ];

        let assistantIndex = 0;
        let scheduleIndex = 0;

        for (const courseGroup of courseGroups) {
            const course = await courseGroup.course;
            const assistant = assistants[assistantIndex % assistants.length];
            const schedule = schedulePatterns[scheduleIndex % schedulePatterns.length];

            // Check if schedule already exists
            const existingSchedule = await this.courseGroupScheduleRepo.findOne({
                where: {
                    courseGroupId: courseGroup.id,
                    assistantId: assistant.id,
                    weekDay: schedule.weekDay,
                    startTime: schedule.startTime,
                }
            });

            if (existingSchedule) {
                console.log(`Schedule already exists for group ${courseGroup.order} in course ${course.name}`);
                scheduleIndex++;
                continue;
            }

            // Create course group schedule
            const courseGroupSchedule = this.courseGroupScheduleRepo.create({
                courseGroupId: courseGroup.id,
                assistantId: assistant.id,
                courseId: course.id,
                labId: courseGroup.labId,
                weekDay: schedule.weekDay,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
            });

            try {
                await this.courseGroupScheduleRepo.save(courseGroupSchedule);
                console.log(`✓ Assigned ${assistant.name} to Group ${String.fromCharCode(64 + courseGroup.order)} in course ${course.name} (${schedule.weekDay} ${schedule.startTime}-${schedule.endTime})`);
            } catch (error) {
                console.error(`✗ Failed to assign ${assistant.name} to group in course ${course.name}:`, error.message);
            }

            // Move to next assistant and schedule pattern
            assistantIndex++;
            scheduleIndex++;
        }

        console.log(`Assigned assistants to ${courseGroups.length} course groups`);
    }
} 