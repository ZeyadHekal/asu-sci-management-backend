import { Course } from 'src/database/courses/course.entity';
import { User } from 'src/database/users/user.entity';

export enum EntityName {
	COURSE = 'courses',
	USER = 'users',
}

export const entityNameToEntityClass: Record<string, Function> = {
	[EntityName.COURSE]: Course,
	[EntityName.USER]: User,
};
