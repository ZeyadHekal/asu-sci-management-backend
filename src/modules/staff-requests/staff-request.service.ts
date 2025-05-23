import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffRequest, StaffRequestStatus } from 'src/database/staff-requests/staff-request.entity';
import { CreateStaffRequestDto, StaffRequestDto, UpdateStaffRequestDto, StaffRequestPagedDto } from './dtos/staff-request.dto';
import { PaginationInput } from 'src/base/pagination.input';
import { UUID } from 'crypto';
import { UserType } from 'src/database/users/user-type.entity';
import { User } from 'src/database/users/user.entity';
import { transformToInstance } from 'src/base/transformToInstance';
import { UserService } from 'src/users/service';
import { CreateUserDto } from 'src/users/dtos';
import { FileService } from 'src/modules/files/file.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StaffRequestService {
	constructor(
		@InjectRepository(StaffRequest)
		private readonly staffRequestRepository: Repository<StaffRequest>,
		@InjectRepository(UserType)
		private readonly userTypeRepository: Repository<UserType>,
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		private readonly userService: UserService,
		private readonly fileService: FileService,
		private readonly configService: ConfigService,
	) {}

	private async addIdPhotoUrl(dto: StaffRequestDto): Promise<StaffRequestDto> {
		if (dto.idPhoto) {
			try {
				const fileId = parseInt(dto.idPhoto);
				if (!isNaN(fileId)) {
					const url = await this.fileService.getSignedUrl(fileId);
					dto.idPhotoUrl = url;
				}
			} catch (error) {
				// If there's an error getting the signed URL, we'll just skip it
				console.error('Error getting signed URL for ID photo:', error);
			}
		}
		return dto;
	}

	private async addIdPhotoUrls(dtos: StaffRequestDto[]): Promise<StaffRequestDto[]> {
		return Promise.all(dtos.map((dto) => this.addIdPhotoUrl(dto)));
	}

	async create(createDto: CreateStaffRequestDto, idPhoto: Express.Multer.File): Promise<StaffRequestDto> {
		// Verify passwords match
		if (createDto.password !== createDto.confirmPassword) {
			throw new BadRequestException('Passwords do not match');
		}

		// Hash the password before storing
		const hashedPassword = await bcrypt.hash(createDto.password, parseInt(this.configService.get<string>('PASSWORD_SALT', '10')));

		// Upload ID photo
		const uploadedPhoto = await this.fileService.uploadFile(idPhoto, { prefix: 'staff-requests' });

		// Create staff request (no username uniqueness check here to prevent bruteforcing)
		const staffRequest = this.staffRequestRepository.create({
			...createDto,
			password: hashedPassword, // Store hashed password
			status: StaffRequestStatus.PENDING,
			idPhoto: uploadedPhoto.id.toString(),
		});

		const savedRequest = await this.staffRequestRepository.save(staffRequest);
		const dto = transformToInstance(StaffRequestDto, savedRequest);
		return this.addIdPhotoUrl(dto);
	}

	async findAll(input: PaginationInput): Promise<StaffRequestPagedDto> {
		const skip = input.page * input.limit;
		const take = input.limit;

		const [requests, total] = await this.staffRequestRepository.findAndCount({
			skip,
			take,
			order: { [input.sortBy]: input.sortOrder },
		});

		const items = await this.addIdPhotoUrls(requests.map((request) => {
			const requestWithDates = {
				...request,
				createdAt: request.created_at,
				updatedAt: request.updated_at,
			};
			return transformToInstance(StaffRequestDto, requestWithDates);
		}));

		return {
			items,
			total,
		};
	}

	async findPending(input: PaginationInput): Promise<StaffRequestPagedDto> {
		const skip = input.page * input.limit;
		const take = input.limit;

		const [requests, total] = await this.staffRequestRepository.findAndCount({
			where: { status: StaffRequestStatus.PENDING },
			skip,
			take,
			order: { [input.sortBy]: input.sortOrder },
		});
		const items = await this.addIdPhotoUrls(requests.map((request) => {
			const requestWithDates = {
				...request,
				createdAt: request.created_at,
				updatedAt: request.updated_at,
			};
			return transformToInstance(StaffRequestDto, requestWithDates);
		}));

		return {
			items,
			total,
		};
	}

	async findOne(id: UUID): Promise<StaffRequestDto> {
		const request = await this.staffRequestRepository.findOneBy({ id });
		if (!request) {
			throw new NotFoundException('Staff request not found');
		}

		const dto = transformToInstance(StaffRequestDto, request);
		return this.addIdPhotoUrl(dto);
	}

	async approve(id: UUID, approvedById: UUID, approveDto: { name: string; username: string; title: string; department: string; userTypeId: UUID }): Promise<StaffRequestDto> {
		const request = await this.staffRequestRepository.findOneBy({ id });
		if (!request) {
			throw new NotFoundException('Staff request not found');
		}

		if (request.status !== StaffRequestStatus.PENDING) {
			throw new BadRequestException('Can only approve pending requests');
		}

		// Verify user type exists
		const userType = await this.userTypeRepository.findOneBy({ id: approveDto.userTypeId });
		if (!userType) {
			throw new BadRequestException('Invalid user type');
		}

		// Check username uniqueness during approval (not during creation)
		const existingUser = await this.userRepository.findOneBy({ username: approveDto.username });
		if (existingUser) {
			throw new BadRequestException('Username is already taken. Please reject this request and ask the user to submit a new request with a different username.');
		}

		// Create the user with the edited data but using the original password
		const createUserDto: CreateUserDto = {
			name: approveDto.name,
			username: approveDto.username,
			password: request.password, // Use the original hashed password from the request
			userTypeId: approveDto.userTypeId,
		};

		// Since the password is already hashed, we need to bypass the hashing in UserService
		// We'll call the repository directly to avoid double-hashing
		const user = await this.userRepository.create({
			name: approveDto.name,
			username: approveDto.username,
			password: request.password, // Already hashed
			userTypeId: approveDto.userTypeId,
			title: approveDto.title,
			department: approveDto.department,
		});

		await this.userRepository.save(user);

		// Update request with the edited data
		request.name = approveDto.name;
		request.username = approveDto.username;
		request.title = approveDto.title;
		request.department = approveDto.department;
		// Don't update password - keep the original hashed one
		request.status = StaffRequestStatus.APPROVED;
		request.approvedById = approvedById;
		request.approvedAt = new Date();
		request.userTypeId = approveDto.userTypeId;

		const savedRequest = await this.staffRequestRepository.save(request);
		const dto = transformToInstance(StaffRequestDto, savedRequest);
		return this.addIdPhotoUrl(dto);
	}

	async reject(id: UUID, rejectionReason: string): Promise<StaffRequestDto> {
		const request = await this.staffRequestRepository.findOneBy({ id });
		if (!request) {
			throw new NotFoundException('Staff request not found');
		}

		if (request.status !== StaffRequestStatus.PENDING) {
			throw new BadRequestException('Can only reject pending requests');
		}

		request.status = StaffRequestStatus.REJECTED;
		request.rejectionReason = rejectionReason;

		const savedRequest = await this.staffRequestRepository.save(request);
		const dto = transformToInstance(StaffRequestDto, savedRequest);
		return this.addIdPhotoUrl(dto);
	}
}
