import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffRequest, StaffRequestStatus } from 'src/database/staff-requests/staff-request.entity';
import { CreateStaffRequestDto, StaffRequestDto, UpdateStaffRequestDto, StaffRequestPagedDto } from './dtos/staff-request.dto';
import { PaginationInput } from 'src/base/pagination.input';
import { UUID } from 'crypto';
import { UserType } from 'src/database/users/user-type.entity';
import { transformToInstance } from 'src/base/transformToInstance';
import { UserService } from 'src/users/service';
import { CreateUserDto } from 'src/users/dtos';
import { FileService } from 'src/modules/files/file.service';

@Injectable()
export class StaffRequestService {
	constructor(
		@InjectRepository(StaffRequest)
		private readonly staffRequestRepository: Repository<StaffRequest>,
		@InjectRepository(UserType)
		private readonly userTypeRepository: Repository<UserType>,
		private readonly userService: UserService,
		private readonly fileService: FileService,
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

		// Upload ID photo
		const uploadedPhoto = await this.fileService.uploadFile(idPhoto, { prefix: 'staff-requests' });

		// Create staff request
		const staffRequest = this.staffRequestRepository.create({
			...createDto,
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

		const items = await this.addIdPhotoUrls(requests.map((request) => transformToInstance(StaffRequestDto, request)));

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

		const items = await this.addIdPhotoUrls(requests.map((request) => transformToInstance(StaffRequestDto, request)));

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

	async approve(id: UUID, approvedById: UUID, userTypeId: UUID): Promise<StaffRequestDto> {
		const request = await this.staffRequestRepository.findOneBy({ id });
		if (!request) {
			throw new NotFoundException('Staff request not found');
		}

		if (request.status !== StaffRequestStatus.PENDING) {
			throw new BadRequestException('Can only approve pending requests');
		}

		// Verify user type exists
		const userType = await this.userTypeRepository.findOneBy({ id: userTypeId });
		if (!userType) {
			throw new BadRequestException('Invalid user type');
		}

		// Create the user first
		const createUserDto: CreateUserDto = {
			name: request.name,
			username: request.email, // Using email as username
			password: request.password,
			userTypeId: userTypeId,
		};

		await this.userService.create(createUserDto);

		// Update request status
		request.status = StaffRequestStatus.APPROVED;
		request.approvedById = approvedById;
		request.approvedAt = new Date();
		request.userTypeId = userTypeId;

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
