import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UserType } from 'src/database/users/user-type.entity';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import * as bcrypt from 'bcrypt';
import {
	CreateStaffDto,
	CreateStudentDto,
	StaffDto,
	StaffPagedDto,
	StudentDto,
	StudentPagedDto,
	DoctorDto,
	DoctorPagedDto,
	StaffPaginationInput,
	UpdateStaffDto,
	UpdateStudentDto,
	UpdateUserPrivilegesDto,
} from './dtos';
import { UUID } from 'crypto';
import { FileService } from '../modules/files/file.service';
import { PaginationInput } from 'src/base/pagination.input';
import { DoctorCourse } from 'src/database/courses/course.entity';
import { Course } from 'src/database/courses/course.entity';
import { UserPrivilege, Privilege, UserTypePrivilege } from 'src/database/privileges/privilege.entity';
import { PrivilegeCode } from 'src/db-seeder/data/privileges';
import { In } from 'typeorm';
import { Student } from 'src/database/students/student.entity';

@Injectable()
export class UserService extends BaseService<imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
		@InjectRepository(UserType) private readonly userTypeRepository: Repository<UserType>,
		@InjectRepository(DoctorCourse) private readonly doctorCourseRepository: Repository<DoctorCourse>,
		@InjectRepository(Course) private readonly courseRepository: Repository<Course>,
		@InjectRepository(UserPrivilege) private readonly userPrivilegeRepository: Repository<UserPrivilege>,
		@InjectRepository(Privilege) private readonly privilegeRepository: Repository<Privilege>,
		@InjectRepository(UserTypePrivilege) private readonly userTypePrivilegeRepository: Repository<UserTypePrivilege>,
		@InjectRepository(Student) private readonly studentRepository: Repository<Student>,
		private readonly fileService: FileService,
	) {
		super(imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto, repository);
	}

	async beforeCreateDto(dto: imports.CreateDto): Promise<imports.CreateDto> {
		const userType = await this.userTypeRepository.findOneBy({ id: dto.userTypeId });
		if (!userType) {
			throw new BadRequestException('Invalid user type id!');
		}
		const user = await this.repository.findOneBy({ username: dto.username });
		if (user) {
			throw new BadRequestException('Username is already used.');
		}
		dto.password = await bcrypt.hash(dto.password, parseInt(this.configService.get<string>('PASSWORD_SALT', '10')));
		return dto;
	}

	async beforeUpdateDto(dto: imports.UpdateDto): Promise<imports.UpdateDto> {
		const userType = await this.userTypeRepository.findOneBy({ id: dto.userTypeId });
		if (!userType) {
			throw new BadRequestException('Invalid user type id!');
		}
		if (dto.username) {
			const user = await this.repository.findOneBy({ username: dto.username });
			if (user && user.username != dto.username) {
				throw new BadRequestException('Username is already used.');
			}
		}
		if (dto.password) {
			dto.password = await bcrypt.hash(dto.password, parseInt(this.configService.get<string>('PASSWORD_SALT', '10')));
		}
		return dto;
	}

	async createStudent(dto: CreateStudentDto, photo?: Express.Multer.File): Promise<StudentDto> {
		const studentType = await this.userTypeRepository.findOneBy({ name: 'Student' });
		if (!studentType) {
			throw new InternalServerErrorException('An error occurred, please contact admin');
		}

		let photoUrl = null;
		if (photo) {
			const uploadedPhoto = await this.fileService.uploadFile(photo);
			photoUrl = uploadedPhoto.id.toString();
		}

		// Add all student fields to the user before creation
		const userToCreate = {
			...dto,
			userTypeId: studentType.id,
			...(photoUrl && { photo: photoUrl }),
		};

		const createdUser = await this.create(userToCreate);

		// Create corresponding Student record in the students table
		const student = this.studentRepository.create({
			id: createdUser.id, // Student ID = User ID for consistency
			seatNo: dto.seatNo,
			level: dto.level,
			program: dto.program,
			photo: photoUrl,
		});
		await this.studentRepository.save(student);

		// Create a student DTO directly from input DTO and created user
		const result = new StudentDto();
		result.id = createdUser.id;
		result.name = createdUser.name;
		result.username = createdUser.username;
		result.seatNo = dto.seatNo;
		result.level = dto.level;
		result.program = dto.program;
		result.photo = photoUrl;

		return result;
	}

	async createStaff(dto: CreateStaffDto, userTypeId: UUID): Promise<StaffDto> {
		const userType = await this.userTypeRepository.findOneBy({ id: userTypeId });
		if (!userType) {
			throw new BadRequestException('Invalid user type id!');
		}

		// Verify this is not a student type
		if (userType.name === 'Student') {
			throw new BadRequestException('Cannot create staff user with Student user type');
		}

		const createdUser = await this.create({
			...dto,
			userTypeId: userType.id,
		});

		return this.mapToStaffDto(createdUser);
	}

	// Map user entity to StudentDTO
	private mapToStudentDto(user: any): StudentDto {
		const dto = new StudentDto();
		dto.id = user.id;
		dto.name = user.name;
		dto.username = user.username;
		dto.seatNo = user.seatNo;
		dto.level = user.level;
		dto.program = user.program;
		dto.photo = user.photo;
		return dto;
	}

	// Map user entity to StaffDTO including privileges
	private async mapToStaffDto(user: any): Promise<StaffDto> {
		const dto = new StaffDto();
		dto.id = user.id;
		dto.name = user.name;
		dto.username = user.username;

		// Handle title - use database value or generate from user type
		if (user.title) {
			dto.title = user.title;
		} else {
			// Get user type name to generate title
			let userTypeName = '';
			if (user.userType) {
				userTypeName = typeof user.userType === 'string' ? user.userType : user.userType.name;
			} else {
				const userType = await this.userTypeRepository.findOneBy({ id: user.userTypeId });
				userTypeName = userType?.name || '';
			}
			dto.title = this.getTitleFromUserType(userTypeName);
		}

		dto.department = user.department || 'Computer Science';
		dto.status = user.status === undefined ? true : user.status;

		// Handle lastLogin - ensure it's always present, use null if not available
		dto.lastLogin = user.lastLogin || null;

		// Set userTypeId
		dto.userTypeId = user.userTypeId;

		// Get user type name - ensure it's always a string name for the table
		if (user.userType) {
			dto.userType = typeof user.userType === 'string' ? user.userType : user.userType.name;
		} else {
			const userType = await this.userTypeRepository.findOneBy({ id: user.userTypeId });
			dto.userType = userType?.name || 'Unknown';
		}

		// Get user privileges separately
		try {
			// Get user type privileges
			const userType = await user.userType;
			const userTypePrivileges = await userType.userTypePrivileges;
			dto.userTypePrivileges = [];
			for (const utp of userTypePrivileges) {
				const privilege = await utp.privilege;
				dto.userTypePrivileges.push(privilege.code);
			}

			// Get user-specific privileges
			const userPrivileges = await user.userPrivileges;
			dto.userPrivileges = [];
			for (const up of userPrivileges) {
				const privilege = await up.privilege;
				dto.userPrivileges.push(privilege.code);
			}

			// Combine for compatibility (existing logic that depends on this)
			dto.privileges = [...new Set([...dto.userTypePrivileges, ...dto.userPrivileges])];
		} catch {
			dto.privileges = [];
			dto.userTypePrivileges = [];
			dto.userPrivileges = [];
		}

		return dto;
	}

	// Helper method to generate title from user type
	private getTitleFromUserType(userType: string): string {
		switch (userType) {
			case 'Doctor':
				return 'Professor';
			case 'Admin':
				return 'Administrator';
			case 'Lab Admin':
				return 'Lab Assistant';
			case 'Secretary':
				return 'Administrative Staff';
			default:
				return 'Staff';
		}
	}

	async getAllStudents(): Promise<StudentDto[]> {
		const studentType = await this.userTypeRepository.findOneBy({ name: 'Student' });
		if (!studentType) {
			throw new InternalServerErrorException('An error occurred, please contact admin');
		}

		const students = await this.repository.find({
			where: { userTypeId: studentType.id },
		});

		return students.map((student) => this.mapToStudentDto(student));
	}

	async getAllStaff(): Promise<StaffDto[]> {
		const studentType = await this.userTypeRepository.findOneBy({ name: 'Student' });
		if (!studentType) {
			throw new InternalServerErrorException('An error occurred, please contact admin');
		}

		const staffUsers = await this.repository.find({
			where: { userTypeId: Not(studentType.id) },
			relations: ['userType', 'userPrivileges', 'userPrivileges.privilege'],
		});

		return Promise.all(staffUsers.map((staff) => this.mapToStaffDto(staff)));
	}

	async getStudentById(id: UUID): Promise<StudentDto> {
		const user = await this.repository.findOne({
			where: { id },
			relations: ['userType'],
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		const userType = await user.userType;
		if (userType.name !== 'Student') {
			throw new BadRequestException('User is not a student');
		}

		return this.mapToStudentDto(user);
	}

	async getStaffById(id: UUID): Promise<StaffDto> {
		const user = await this.repository.findOne({
			where: { id },
			relations: ['userType', 'userPrivileges', 'userPrivileges.privilege'],
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		const userType = await user.userType;
		if (userType.name === 'Student') {
			throw new BadRequestException('User is not a staff member');
		}

		return this.mapToStaffDto(user);
	}

	async updateStudent(id: UUID, dto: UpdateStudentDto): Promise<StudentDto> {
		const user = await this.repository.findOne({
			where: { id },
			relations: ['userType'],
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		const userType = await user.userType;
		if (userType.name !== 'Student') {
			throw new BadRequestException('User is not a student');
		}

		const updatedUser = await this.update(id, dto);

		// Update corresponding Student record if student-specific fields are being updated
		const studentFieldsToUpdate: any = {};
		if ('seatNo' in dto) studentFieldsToUpdate.seatNo = dto.seatNo;
		if ('level' in dto) studentFieldsToUpdate.level = dto.level;
		if ('program' in dto) studentFieldsToUpdate.program = dto.program;
		if ('photo' in dto) studentFieldsToUpdate.photo = dto.photo;

		if (Object.keys(studentFieldsToUpdate).length > 0) {
			// Find or create the student record
			let student = await this.studentRepository.findOneBy({ id });
			if (!student) {
				// Create student record if it doesn't exist (for legacy users)
				student = this.studentRepository.create({
					id: id,
					seatNo: dto.seatNo || 0,
					level: dto.level || 1,
					program: dto.program || 'Computer Science',
					photo: dto.photo || null,
				});
			} else {
				// Update existing student record
				Object.assign(student, studentFieldsToUpdate);
			}
			await this.studentRepository.save(student);
		}

		return this.mapToStudentDto(updatedUser);
	}

	async updateStaff(id: UUID, dto: UpdateStaffDto): Promise<StaffDto> {
		const user = await this.repository.findOne({
			where: { id },
			relations: ['userType'],
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		const userType = await user.userType;
		if (userType.name === 'Student') {
			throw new BadRequestException('User is not a staff member');
		}

		// Hash password if provided
		if (dto.password) {
			dto.password = await bcrypt.hash(dto.password, parseInt(this.configService.get<string>('PASSWORD_SALT', '10')));
		}


		// Check for username uniqueness if username is being updated
		if (dto.username && dto.username !== user.username) {
			const existingUserWithUsername = await this.repository.findOne({
				where: { username: dto.username },
			});
			if (existingUserWithUsername && existingUserWithUsername.id !== id) {
				throw new BadRequestException('Username is already in use by another user');
			}
		}
		let newUserType = null;

		// Validate userType change if provided
		if (dto.userTypeId !== user.userTypeId) {
			newUserType = await this.userTypeRepository.findOneBy({ id: dto.userTypeId });
			if (!newUserType) {
				throw new BadRequestException('Invalid user type');
			}
			if (newUserType.name === 'Student') {
				throw new BadRequestException('Cannot change staff to student type');
			}
		}

		// Update the user entity
		Object.assign(user, dto);
		const updatedUser = await user.save();
		if (newUserType) {
			await this.repository.update(id, { userTypeId: newUserType.id });
		}
		return this.mapToStaffDto(updatedUser);
	}

	async getPaginatedStudents(input: PaginationInput): Promise<StudentPagedDto> {
		const studentType = await this.userTypeRepository.findOneBy({ name: 'Student' });
		if (!studentType) {
			throw new InternalServerErrorException('An error occurred, please contact admin');
		}

		const skip = input.page * input.limit;
		const take = input.limit;

		const [students, total] = await this.repository.findAndCount({
			where: { userTypeId: studentType.id },
			relations: ['userType'],
			skip,
			take,
			order: { [input.sortBy]: input.sortOrder },
		});

		const items = students.map((student) => this.mapToStudentDto(student));

		return {
			items,
			total,
		};
	}

	async getPaginatedStaff(input: StaffPaginationInput): Promise<StaffPagedDto> {
		const studentType = await this.userTypeRepository.findOneBy({ name: 'Student' });
		if (!studentType) {
			throw new InternalServerErrorException('An error occurred, please contact admin');
		}

		const skip = input.page * input.limit;
		const take = input.limit;

		// Build query using QueryBuilder to handle filters
		const query = this.repository
			.createQueryBuilder('user')
			.leftJoinAndSelect('user.userType', 'userType')
			.leftJoinAndSelect('user.userPrivileges', 'userPrivileges')
			.leftJoinAndSelect('userPrivileges.privilege', 'privilege')
			.where('user.userTypeId != :studentTypeId', { studentTypeId: studentType.id });

		// Apply filters if provided
		if (input.department) {
			query.andWhere('user.department LIKE :department', { department: `%${input.department}%` });
		}

		if (input.userType) {
			query.andWhere('userType.name LIKE :userType', { userType: input.userType });
		}

		if (input.status !== undefined) {
			query.andWhere('user.status = :status', { status: input.status });
		}

		// Apply pagination and sorting
		query
			.skip(skip)
			.take(take)
			.orderBy(`user.${input.sortBy}`, input.sortOrder.toUpperCase() as 'ASC' | 'DESC');

		const [staffUsers, total] = await query.getManyAndCount();

		const items = await Promise.all(staffUsers.map((staff) => this.mapToStaffDto(staff)));

		return {
			items,
			total,
		};
	}

	// Map user entity to DoctorDTO including assigned courses
	private async mapToDoctorDto(user: any): Promise<DoctorDto> {
		const dto = new DoctorDto();
		dto.id = user.id;
		dto.name = user.name;
		dto.username = user.username;
		dto.email = user.email || user.username;
		dto.title = user.title || 'Professor';
		dto.department = user.department || 'Computer Science';
		dto.status = user.status === undefined ? true : user.status;
		dto.lastLogin = user.lastLogin || new Date();

		// Get assigned courses
		const doctorCourses = await this.doctorCourseRepository.find({
			where: { doctor_id: user.id },
			relations: ['course'],
		});

		const assignedCourses = await Promise.all(
			doctorCourses.map(async (dc) => {
				const course = await dc.course;
				return `${course.subjectCode}${course.courseNumber}`;
			}),
		);

		dto.assignedCourses = assignedCourses;

		return dto;
	}

	async getAllDoctors(): Promise<DoctorDto[]> {
		// Find the TEACH_COURSE privilege
		const teachCoursePrivilege = await this.privilegeRepository.findOneBy({ code: PrivilegeCode.TEACH_COURSE });
		if (!teachCoursePrivilege) {
			return [];
		}

		// Get all users with TEACH_COURSE privilege (both direct and through user type)
		const userPrivileges = await this.userPrivilegeRepository.find({
			where: { privilege_id: teachCoursePrivilege.id },
		});

		const directUserIds = userPrivileges.map(up => up.user_id);

		// Also get users whose user type has this privilege
		const userTypePrivileges = await this.userTypePrivilegeRepository.find({
			where: { privilege_id: teachCoursePrivilege.id },
		});

		const userTypeIds = userTypePrivileges.map(utp => utp.user_type_id);

		// Get users with those user types
		const usersWithTypePrivilege = userTypeIds.length > 0
			? await this.repository.find({ where: { userTypeId: In(userTypeIds) } })
			: [];

		const userTypeUserIds = usersWithTypePrivilege.map(user => user.id);

		// Combine and deduplicate user IDs
		const allUserIds = [...new Set([...directUserIds, ...userTypeUserIds])];

		if (allUserIds.length === 0) {
			return [];
		}

		// Get full user entities with relations
		const fullUsers = await this.repository.find({
			where: { id: In(allUserIds) },
			relations: ['userType', 'userPrivileges', 'userPrivileges.privilege']
		});

		// Map to DTOs
		return Promise.all(fullUsers.map(user => this.mapToDoctorDto(user)));
	}

	async getAllAssistants(): Promise<StaffDto[]> {
		// Find the LAB_ASSISTANT privilege
		const labAssistantPrivilege = await this.privilegeRepository.findOneBy({ code: PrivilegeCode.LAB_ASSISTANT });
		if (!labAssistantPrivilege) {
			return [];
		}

		// Get all users with LAB_ASSISTANT privilege (both direct and through user type)
		const userPrivileges = await this.userPrivilegeRepository.find({
			where: { privilege_id: labAssistantPrivilege.id },
		});

		const directUserIds = userPrivileges.map(up => up.user_id);

		// Also get users whose user type has this privilege
		const userTypePrivileges = await this.userTypePrivilegeRepository.find({
			where: { privilege_id: labAssistantPrivilege.id },
		});

		const userTypeIds = userTypePrivileges.map(utp => utp.user_type_id);

		// Get users with those user types
		const usersWithTypePrivilege = userTypeIds.length > 0
			? await this.repository.find({ where: { userTypeId: In(userTypeIds) } })
			: [];

		const userTypeUserIds = usersWithTypePrivilege.map(user => user.id);

		// Combine and deduplicate user IDs
		const allUserIds = [...new Set([...directUserIds, ...userTypeUserIds])];

		if (allUserIds.length === 0) {
			return [];
		}

		// Get full user entities with relations
		const fullUsers = await this.repository.find({
			where: { id: In(allUserIds) },
			relations: ['userType', 'userPrivileges', 'userPrivileges.privilege']
		});

		// Map to DTOs
		return Promise.all(fullUsers.map(user => this.mapToStaffDto(user)));
	}

	async getPaginatedDoctors(input: PaginationInput): Promise<DoctorPagedDto> {
		const skip = input.page * input.limit;
		const take = input.limit;

		// Get all users with TEACH_COURSE privilege with pagination
		const query = this.userPrivilegeRepository
			.createQueryBuilder('up')
			.innerJoin('up.privilege', 'privilege')
			.innerJoin('up.user', 'user')
			.where('privilege.code = :code', { code: PrivilegeCode.TEACH_COURSE })
			.skip(skip)
			.take(take);

		const [userPrivileges, total] = await query.getManyAndCount();
		const doctorIds = userPrivileges.map((up) => up.user_id);

		if (doctorIds.length === 0) {
			return { items: [], total: 0 };
		}

		const doctors = await this.repository.findByIds(doctorIds);
		const items = await Promise.all(doctors.map((doctor) => this.mapToDoctorDto(doctor)));

		return {
			items,
			total,
		};
	}

	async updateUserPrivileges(userId: UUID, dto: UpdateUserPrivilegesDto): Promise<StaffDto> {
		// Find the user
		const user = await this.repository.findOne({
			where: { id: userId },
			relations: ['userType', 'userPrivileges', 'userPrivileges.privilege'],
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		// Get all available privileges to validate the provided codes
		const allPrivileges = await this.privilegeRepository.find();
		const privilegeMap = new Map(allPrivileges.map((p) => [p.code, p]));

		// Validate that all provided privilege codes exist
		for (const privilegeCode of dto.privileges) {
			if (!privilegeMap.has(privilegeCode)) {
				throw new BadRequestException(`Invalid privilege code: ${privilegeCode}`);
			}
		}

		// Remove existing user-specific privileges
		await this.userPrivilegeRepository.delete({ user_id: userId });

		// Add new user-specific privileges
		const userPrivileges = dto.privileges.map((privilegeCode) => {
			const privilege = privilegeMap.get(privilegeCode)!;
			const userPrivilege = new UserPrivilege();
			userPrivilege.user_id = userId;
			userPrivilege.privilege_id = privilege.id;
			userPrivilege.resourceIds = null; // For now, setting as null (all resources)
			return userPrivilege;
		});

		if (userPrivileges.length > 0) {
			await this.userPrivilegeRepository.save(userPrivileges);
		}

		// Reload user with updated privileges and return as StaffDto
		const updatedUser = await this.repository.findOne({
			where: { id: userId },
			relations: ['userType', 'userPrivileges', 'userPrivileges.privilege'],
		});

		return this.mapToStaffDto(updatedUser!);
	}

	async deleteStudent(id: UUID): Promise<void> {
		const user = await this.repository.findOne({
			where: { id },
			relations: ['userType'],
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		const userType = await user.userType;
		if (userType.name !== 'Student') {
			throw new BadRequestException('User is not a student');
		}

		// Delete corresponding Student record first
		await this.studentRepository.delete({ id });

		// Delete user-specific privileges first
		await this.userPrivilegeRepository.delete({ user_id: id });

		// Delete the user
		await this.repository.delete(id);
	}

	async deleteStaff(id: UUID): Promise<void> {
		const user = await this.repository.findOne({
			where: { id },
			relations: ['userType'],
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		const userType = await user.userType;
		if (userType.name === 'Student') {
			throw new BadRequestException('User is not a staff member');
		}

		// Delete user-specific privileges first
		await this.userPrivilegeRepository.delete({ user_id: id });

		// Delete doctor course assignments if any
		await this.doctorCourseRepository.delete({ doctor_id: id });

		// Delete the user
		await this.repository.delete(id);
	}
}
