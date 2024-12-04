import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Privilege } from '../database/privileges/privilege.entity';
import { User } from 'src/database/users/user.entity';
import { Request } from 'express';

@Injectable()
export class PrivilegeService {
	constructor(
		@InjectRepository(Privilege)
		private privilegeRepository: Repository<Privilege>,
	) {}

	async checkUserPrivileges(user: User, requiredPrivileges: string[], request: Request): Promise<boolean> {
		const privileges = await this.privilegeRepository.find({
			where: {
				name: In(requiredPrivileges),
				users: { id: user.id },
			},
		});

		if (privileges.length === 0) {
			return false;
		}

		for (const privilege of privileges) {
			// Check if the privilege is parameterized
			if (privilege.parameterStructure && privilege.parameterStructure.length > 0) {
				const isValid = this.validateParameters(privilege.parameterStructure, request);
				if (!isValid) {
					return false;
				}
			}
		}

		return true;
	}

	// Get a privilege by its code
	async getPrivilegeByCode(code: string): Promise<Privilege | undefined> {
		return this.privilegeRepository.findOne({ where: { code } });
	}

	private validateParameters(privilegeData: Privilege, request: any): boolean {
		const { parameterStructure } = privilegeData;

		// Iterate over each part of the parameter structure and validate
		for (const param of parameterStructure) {
			const { fieldLocation, fieldName, data } = param;

			let fieldValue;
			// Retrieve the value of the field based on its location (body, query, path)
			if (fieldLocation === 'body') {
				fieldValue = request.body[fieldName];
			} else if (fieldLocation === 'query') {
				fieldValue = request.query[fieldName];
			} else if (fieldLocation === 'path') {
				fieldValue = request.params[fieldName];
			}

			// If the field value is not found or doesn't match the expected data, return false
			if (!fieldValue || !data.includes(fieldValue)) {
				return false; // Invalid parameter
			}
		}

		return true; // All parameters are valid
	}

	async getUserPrivileges(user: User): Promise<string[]> {
		const userPrivileges = await this.privilegeRepository
			.createQueryBuilder('privilege')
			.innerJoin('privilege.users', 'user', 'user.id = :userId', { userId: user.id })
			.getMany();

		const userTypePrivileges = await this.privilegeRepository
			.createQueryBuilder('privilege')
			.innerJoin('privilege.userTypes', 'userType', 'userType.id = :userTypeId', { userTypeId: user.userTypeId })
			.getMany();

		// Combine user and user type privileges
		return [...userPrivileges.map((privilege) => privilege.name), ...userTypePrivileges.map((privilege) => privilege.name)];
	}

	async getAllPrivileges(): Promise<Privilege[]> {
		return this.privilegeRepository.find(); // Retrieving all privileges from the database
	}
}
