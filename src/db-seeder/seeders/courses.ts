import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Course, DoctorCourse } from 'src/database/courses/course.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { User } from 'src/database/users/user.entity';
import { UserType } from 'src/database/users/user-type.entity';
import { COURSES_CONFIG } from '../data/courses';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CourseSeeder {
	constructor(
		@InjectRepository(Course) private courseRepo: Repository<Course>,
		@InjectRepository(CourseGroup) private courseGroupRepo: Repository<CourseGroup>,
		@InjectRepository(User) private userRepo: Repository<User>,
		@InjectRepository(UserType) private userTypeRepo: Repository<UserType>,
		@InjectRepository(DoctorCourse) private doctorCourseRepo: Repository<DoctorCourse>,
		private configService: ConfigService,
	) {}

	public async seed() {
		for (const courseConfig of COURSES_CONFIG) {
			// Generate a unique course code based on subject and number
			const courseCode = `${courseConfig.subjectCode}${courseConfig.courseNumber}`;

			// Check if course already exists
			const existingCourse = await this.courseRepo.findOneBy({
				subjectCode: courseConfig.subjectCode,
				courseNumber: courseConfig.courseNumber,
			});

			if (existingCourse) {
				break;
			}

			if (!existingCourse) {
				// Create the course
				const course = this.courseRepo.create({
					name: courseConfig.name,
					subjectCode: courseConfig.subjectCode,
					courseNumber: courseConfig.courseNumber,
					creditHours: courseConfig.creditHours,
					hasLab: courseConfig.hasLab,
					labDuration: courseConfig.labDuration,
					attendanceMarks: courseConfig.attendanceMarks,
				});

				const savedCourse = await this.courseRepo.save(course);
				console.log(`Created course: ${courseConfig.subjectCode}${courseConfig.courseNumber} - ${courseConfig.name}`);

				// Create default group for practical courses
				if (savedCourse.hasLab) {
					await this.createDefaultGroup(savedCourse.id);
				}
			}
		}

		// Assign doctors to courses that don't have one
		await this.assignDoctorsToUnassignedCourses();

		console.log('Course seeding completed');
	}

	private async createDefaultGroup(courseId: string): Promise<void> {
		// Check if default group already exists
		const existingDefaultGroup = await this.courseGroupRepo.findOne({
			where: { courseId: courseId as any, isDefault: true },
		});

		if (existingDefaultGroup) {
			return; // Default group already exists
		}

		// Create default group with order 999 for lowest priority
		const defaultGroup = this.courseGroupRepo.create({
			courseId: courseId as any,
			order: 999, // Set to 999 for lowest priority
			groupNumber: 999,
			isDefault: true,
			labId: null, // No lab assigned initially
			capacity: 0, // Will be calculated when lab is assigned
		});

		await this.courseGroupRepo.save(defaultGroup);
		console.log(`Created default group for course: ${courseId}`);
	}

	private async assignDoctorsToUnassignedCourses(): Promise<void> {
		// Find all doctors
		const doctorUserType = await this.userTypeRepo.findOneBy({ name: 'Doctor' });
		if (!doctorUserType) {
			console.log('No Doctor user type found, skipping doctor assignment to courses');
			return;
		}

		const doctors = await this.userRepo.find({
			where: { userTypeId: doctorUserType.id }
		});

		if (doctors.length === 0) {
			console.log('No doctors found, skipping doctor assignment to courses');
			return;
		}

		// Find all courses that don't have a doctor assigned
		const coursesWithoutDoctors = await this.courseRepo
			.createQueryBuilder('course')
			.leftJoin('doctor_courses', 'dc', 'dc.course_id = course.id')
			.where('dc.course_id IS NULL')
			.getMany();

		if (coursesWithoutDoctors.length === 0) {
			console.log('All courses already have doctors assigned');
			return;
		}

		console.log(`Found ${coursesWithoutDoctors.length} courses without doctors, assigning random doctors...`);

		// Assign a random doctor to each unassigned course
		for (const course of coursesWithoutDoctors) {
			const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];

			// Create doctor-course association
			const doctorCourse = this.doctorCourseRepo.create({
				doctor_id: randomDoctor.id,
				course_id: course.id,
			});

			await this.doctorCourseRepo.save(doctorCourse);
			console.log(`Assigned doctor ${randomDoctor.name} to course ${course.subjectCode}${course.courseNumber} - ${course.name}`);
		}

		console.log('Doctor assignment to unassigned courses completed');
	}
}
