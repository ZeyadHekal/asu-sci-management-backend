import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as imports from './imports';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UserType } from 'src/database/users/user-type.entity';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/base/base.service';
import * as bcrypt from 'bcrypt';
import { CreateStaffDto, CreateStudentDto, StaffDto, StudentDto } from './dtos';
import { transformToInstance } from 'src/base/transformToInstance';
import { UUID } from 'crypto';

@Injectable()
export class UserService extends BaseService<imports.Entity, imports.CreateDto, imports.UpdateDto, imports.GetDto, imports.GetListDto> {
	constructor(
		private readonly configService: ConfigService,
		@InjectRepository(imports.Entity) protected readonly repository: Repository<imports.Entity>,
		@InjectRepository(UserType) private readonly userTypeRepository: Repository<UserType>,
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

	async createStudent(dto: CreateStudentDto): Promise<StudentDto> {
		const studentType = await this.userTypeRepository.findOneBy({ name: "Student" });
		if (!studentType) {
			throw new InternalServerErrorException("An error occurred, please contact admin");
		}
		const createdUser = await this.create({
			...dto,
			userTypeId: studentType.id
		});

		const result = transformToInstance(StudentDto, createdUser);
		result.userType = studentType.name;
		return result;
	}

	async createStaff(dto: CreateStaffDto, userTypeId: UUID): Promise<StaffDto> {
		const userType = await this.userTypeRepository.findOneBy({ id: userTypeId });
		if (!userType) {
			throw new BadRequestException("Invalid user type id!");
		}

		// Verify this is not a student type
		if (userType.name === "Student") {
			throw new BadRequestException("Cannot create staff user with Student user type");
		}

		const createdUser = await this.create({
			...dto,
			userTypeId: userType.id
		});

		const result = transformToInstance(StaffDto, createdUser);
		result.userType = userType.name;
		return result;
	}

	async getAllStudents(): Promise<StudentDto[]> {
		const studentType = await this.userTypeRepository.findOneBy({ name: "Student" });
		if (!studentType) {
			throw new InternalServerErrorException("An error occurred, please contact admin");
		}

		const students = await this.repository.find({
			where: { userTypeId: studentType.id },
			relations: ['userType']
		});

		return students.map(student => {
			const dto = transformToInstance(StudentDto, student);
			dto.userType = studentType.name;
			return dto;
		});
	}

	async getAllStaff(): Promise<StaffDto[]> {
		const studentType = await this.userTypeRepository.findOneBy({ name: "Student" });
		if (!studentType) {
			throw new InternalServerErrorException("An error occurred, please contact admin");
		}

		const staffUsers = await this.repository.find({
			where: { userTypeId: Not(studentType.id) },
			relations: ['userType']
		});

		return await Promise.all(staffUsers.map(async staff => {
			const userType = await staff.userType;
			const dto = transformToInstance(StaffDto, staff);
			dto.userType = userType.name;
			return dto;
		}));
	}

	async getStudentById(id: UUID): Promise<StudentDto> {
		const user = await this.repository.findOne({
			where: { id },
			relations: ['userType']
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		const userType = await user.userType;
		if (userType.name !== "Student") {
			throw new BadRequestException('User is not a student');
		}

		const result = transformToInstance(StudentDto, user);
		result.userType = userType.name;
		return result;
	}

	async getStaffById(id: UUID): Promise<StaffDto> {
		const user = await this.repository.findOne({
			where: { id },
			relations: ['userType']
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		const userType = await user.userType;
		if (userType.name === "Student") {
			throw new BadRequestException('User is not a staff member');
		}

		const result = transformToInstance(StaffDto, user);
		result.userType = userType.name;
		return result;
	}

	async updateStudent(id: UUID, dto: imports.UpdateDto): Promise<StudentDto> {
		const user = await this.repository.findOne({
			where: { id },
			relations: ['userType']
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		const userType = await user.userType;
		if (userType.name !== "Student") {
			throw new BadRequestException('User is not a student');
		}

		// Ensure userTypeId remains for Student
		if (dto.userTypeId) {
			const newUserType = await this.userTypeRepository.findOneBy({ id: dto.userTypeId });
			if (!newUserType || newUserType.name !== "Student") {
				throw new BadRequestException('Cannot change student to non-student type');
			}
		}

		const updatedUser = await this.update(id, dto);
		const result = transformToInstance(StudentDto, updatedUser);
		result.userType = userType.name;
		return result;
	}

	async updateStaff(id: UUID, dto: imports.UpdateDto): Promise<StaffDto> {
		const user = await this.repository.findOne({
			where: { id },
			relations: ['userType']
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		const userType = await user.userType;
		if (userType.name === "Student") {
			throw new BadRequestException('User is not a staff member');
		}

		// Ensure userTypeId is not changed to Student
		if (dto.userTypeId) {
			const newUserType = await this.userTypeRepository.findOneBy({ id: dto.userTypeId });
			if (!newUserType) {
				throw new BadRequestException('Invalid user type');
			}
			if (newUserType.name === "Student") {
				throw new BadRequestException('Cannot change staff to student type');
			}
		}

		const updatedUser = await this.update(id, dto);
		const result = transformToInstance(StaffDto, updatedUser);
		result.userType = userType.name;
		return result;
	}
}
