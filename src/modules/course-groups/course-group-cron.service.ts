import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from 'src/database/courses/course.entity';
import { CourseGroup } from 'src/database/courses/course-group.entity';
import { Lab } from 'src/database/labs/lab.entity';

@Injectable()
export class CourseGroupCronService {
	private readonly logger = new Logger(CourseGroupCronService.name);

	constructor(
		@InjectRepository(Course) private readonly courseRepository: Repository<Course>,
		@InjectRepository(CourseGroup) private readonly courseGroupRepository: Repository<CourseGroup>,
		@InjectRepository(Lab) private readonly labRepository: Repository<Lab>,
	) {}

	@Cron(CronExpression.EVERY_MINUTE)
	async createDefaultGroupsForPracticalCourses() {
		try {
			this.logger.log('Starting CRON job: Creating default groups for practical courses');

			// First, check if course_groups table exists by trying to count records
			// This will handle the case where the table doesn't exist yet
			try {
				await this.courseGroupRepository.count();
			} catch (tableError) {
				this.logger.warn('CourseGroup table does not exist yet, skipping CRON job');
				return;
			}

			// Get all practical courses
			const practicalCourses = await this.courseRepository.find({
				where: { hasLab: true },
			});

			if (practicalCourses.length === 0) {
				this.logger.log('No practical courses found');
				return;
			}

			// Find practical courses that don't have a default group
			const practicalCoursesWithoutDefaultGroup: Course[] = [];

			for (const course of practicalCourses) {
				const existingDefaultGroup = await this.courseGroupRepository.findOne({
					where: { courseId: course.id, isDefault: true },
				});

				if (!existingDefaultGroup) {
					practicalCoursesWithoutDefaultGroup.push(course);
				}
			}

			if (practicalCoursesWithoutDefaultGroup.length === 0) {
				this.logger.log('No practical courses without default groups found');
				return;
			}

			this.logger.log(`Found ${practicalCoursesWithoutDefaultGroup.length} practical courses without default groups`);

			// Create default groups for each practical course
			const defaultGroupsToCreate: CourseGroup[] = [];

			for (const course of practicalCoursesWithoutDefaultGroup) {
				try {
					// Try to find a lab already used by existing groups for this course
					const assignedLab = await this.findLabFromExistingGroups(course.id);

					// Create the group regardless of lab availability
					// Double-check if group already exists (race condition protection)
					const existingGroup = await this.courseGroupRepository.findOne({
						where: { courseId: course.id, isDefault: true },
					});

					if (existingGroup) {
						this.logger.debug(`Default group already exists for course ${course.name}`);
						continue;
					}

					const courseGroup = new CourseGroup();
					courseGroup.courseId = course.id;
					courseGroup.labId = assignedLab?.id || null; // Set to null if no lab available
					courseGroup.order = 1;
					courseGroup.isDefault = true;

					if (!assignedLab) {
						this.logger.log(`Created default group for course ${course.name} without lab assignment - lab can be assigned later`);
					} else {
						this.logger.debug(`Created default group for course ${course.name} with lab ${assignedLab.name}`);
					}

					defaultGroupsToCreate.push(courseGroup);
				} catch (courseError) {
					this.logger.error(`Error processing course ${course.name}:`, courseError);
				}
			}

			if (defaultGroupsToCreate.length > 0) {
				await this.courseGroupRepository.save(defaultGroupsToCreate);
				this.logger.log(`Successfully created ${defaultGroupsToCreate.length} default course groups`);
			}
		} catch (error) {
			this.logger.error('Error in CRON job createDefaultGroupsForPracticalCourses:', error);
		}
	}

	private async findLabFromExistingGroups(courseId: string): Promise<Lab | null> {
		try {
			// Look for existing course groups for this course and get their lab
			const existingGroup = await this.courseGroupRepository.findOne({
				where: { courseId: courseId as any },
				order: { order: 'ASC' }, // Get the first group by order
			});

			if (existingGroup) {
				return await this.labRepository.findOne({
					where: { id: existingGroup.labId },
				});
			}

			return null;
		} catch (error) {
			this.logger.debug('Error finding lab from existing groups, will use default assignment');
			return null;
		}
	}

	// Optional: Manual trigger for testing
	async manuallyCreateDefaultGroups(): Promise<{ created: number; errors: string[] }> {
		this.logger.log('Manually triggering default group creation');

		const result = { created: 0, errors: [] as string[] };

		try {
			await this.createDefaultGroupsForPracticalCourses();
			result.created = await this.courseGroupRepository.count({ where: { isDefault: true } });
		} catch (error) {
			result.errors.push(error.message);
		}

		return result;
	}
}
