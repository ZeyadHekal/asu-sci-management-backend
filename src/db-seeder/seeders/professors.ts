import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/users/user.entity';
import { ConfigService } from '@nestjs/config';
import { hashSync } from 'bcrypt';
import { PROFESSORS_CONFIG } from '../data/professors';
import { UserType } from 'src/database/users/user-type.entity';
import { Course } from 'src/database/courses/course.entity';
import { DoctorCourse } from 'src/database/courses/course.entity';
import { UserPrivilege, Privilege } from 'src/database/privileges/privilege.entity';
import { PrivilegeCode } from '../data/privileges';

@Injectable()
export class ProfessorSeeder {
	constructor(
		@InjectRepository(User) private userRepo: Repository<User>,
		@InjectRepository(UserType) private userTypeRepo: Repository<UserType>,
		@InjectRepository(Course) private courseRepo: Repository<Course>,
		@InjectRepository(DoctorCourse) private doctorCourseRepo: Repository<DoctorCourse>,
		@InjectRepository(Privilege) private privilegeRepo: Repository<Privilege>,
		@InjectRepository(UserPrivilege) private userPrivilegeRepo: Repository<UserPrivilege>,
		private configService: ConfigService,
	) {}

	public async seed() {
		// Find the Doctor user type or create if doesn't exist
		let userType = await this.userTypeRepo.findOneBy({ name: 'Doctor' });

		if (!userType) {
			// Create Doctor user type if it doesn't exist
			userType = this.userTypeRepo.create({
				name: 'Doctor',
			});
			await this.userTypeRepo.save(userType);
			console.log('Created Doctor user type');
		}

		// Find the TEACH_COURSE privilege
		const teachCoursePrivilege = await this.privilegeRepo.findOneBy({
			code: PrivilegeCode.TEACH_COURSE,
		});

		if (!teachCoursePrivilege) {
			console.error("Couldn't find TEACH_COURSE privilege. Skipping professor seeding.");
			return;
		}

		// Create professors and assign courses
		for (const professorConfig of PROFESSORS_CONFIG) {
			// Generate username if not provided
			const username = professorConfig.username || professorConfig.name.toLowerCase().replace(/\s+/g, '.');

			// Check if professor already exists
			let professor = await this.userRepo.findOneBy({ username });

			if (!professor) {
				// Create the professor user
				professor = this.userRepo.create({
					name: professorConfig.name,
					username,
					password: hashSync(professorConfig.password || 'Abcd@1234', 10),
					userTypeId: userType.id,
				});

				await this.userRepo.save(professor);
				console.log(`Created professor: ${professorConfig.name}`);
			} else {
				console.log(`Professor ${professorConfig.name} already exists, skipping creation`);
			}

			// Assign the TEACH_COURSE privilege to the professor if not already assigned
			const existingPrivilege = await this.userPrivilegeRepo.findOneBy({
				user_id: professor.id,
				privilege_id: teachCoursePrivilege.id,
			});

			if (!existingPrivilege) {
				const userPrivilege = this.userPrivilegeRepo.create({
					user_id: professor.id,
					privilege_id: teachCoursePrivilege.id,
				});
				await this.userPrivilegeRepo.save(userPrivilege);
				console.log(`Assigned TEACH_COURSE privilege to ${professorConfig.name}`);
			}

			// Assign courses to professor
			for (const courseAssignment of professorConfig.courses) {
				// Find the course
				const course = await this.courseRepo.findOneBy({
					subjectCode: courseAssignment.courseCode,
					courseNumber: courseAssignment.courseNumber,
				});

				if (!course) {
					console.warn(
						`Course ${courseAssignment.courseCode}${courseAssignment.courseNumber} not found. Skipping assignment to ${professorConfig.name}.`,
					);
					continue;
				}

				// Check if course is already assigned to professor
				const existingAssignment = await this.doctorCourseRepo.findOneBy({
					doctor_id: professor.id,
					course_id: course.id,
				});

				if (!existingAssignment) {
					// Create doctor-course association
					const doctorCourse = this.doctorCourseRepo.create({
						doctor_id: professor.id,
						course_id: course.id,
					});
					await this.doctorCourseRepo.save(doctorCourse);
					console.log(`Assigned course ${courseAssignment.courseCode}${courseAssignment.courseNumber} to ${professorConfig.name}`);
				}
			}
		}

		console.log('Professor seeding completed');
	}
}
