import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/database/courses/course.entity';
import { COURSES_CONFIG } from '../data/courses';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CourseSeeder {
	constructor(
		@InjectRepository(Course) private courseRepo: Repository<Course>,
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

				await this.courseRepo.save(course);
				console.log(`Created course: ${courseConfig.subjectCode}${courseConfig.courseNumber} - ${courseConfig.name}`);
			}
		}

		console.log('Course seeding completed');
	}
}
