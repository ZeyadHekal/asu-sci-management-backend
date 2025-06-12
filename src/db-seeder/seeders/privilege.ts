import { Injectable, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PRIVILEGE_SEED_DATA } from '../data/privileges';
import { Privilege } from 'src/database/privileges/privilege.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PrivilegeSeeder {
	constructor(@InjectRepository(Privilege) private repo: Repository<Privilege>) {}

	public async seed() {
		const existing = await this.repo.find();

		const definedPrivileges = PRIVILEGE_SEED_DATA.map((p) => p.code);
		const existingNames = existing.map((e) => e.code);

		// Add missing privileges
		const toAdd = PRIVILEGE_SEED_DATA.filter((p) => !existingNames.includes(p.code));
		if (toAdd.length) {
			await this.repo.insert(toAdd);
		}

		// Remove extraneous privileges
		const toRemove = existing.filter((e) => !definedPrivileges.includes(e.code));
		if (toRemove.length) {
			await this.repo.remove(toRemove);
		}

		// Update changed attributes if needed
		for (const seedPriv of PRIVILEGE_SEED_DATA) {
			const dbPrivilege = await this.repo.findOneBy({ code: seedPriv.code });
			if (dbPrivilege) {
				let updated = false;

				if (dbPrivilege.friendlyName !== seedPriv.friendlyName) {
					dbPrivilege.friendlyName = seedPriv.friendlyName;
					updated = true;
				}
				if (dbPrivilege.group !== seedPriv.group) {
					dbPrivilege.group = seedPriv.group;
					updated = true;
				}
				if (dbPrivilege.requiresResource !== seedPriv.requiresResource) {
					dbPrivilege.requiresResource = seedPriv.requiresResource;
					updated = true;
				}
				if (dbPrivilege.paramKey !== seedPriv.paramKey) {
					dbPrivilege.paramKey = seedPriv.paramKey;
					updated = true;
				}
				if (dbPrivilege.entityName !== seedPriv.entityName) {
					dbPrivilege.entityName = seedPriv.entityName;
					updated = true;
				}
				// Update new fields
				if (dbPrivilege.name !== seedPriv.name) {
					dbPrivilege.name = seedPriv.name;
					updated = true;
				}
				if (dbPrivilege.key !== seedPriv.key) {
					dbPrivilege.key = seedPriv.key;
					updated = true;
				}
				if (dbPrivilege.description !== seedPriv.description) {
					dbPrivilege.description = seedPriv.description;
					updated = true;
				}
				if (dbPrivilege.category !== seedPriv.category) {
					dbPrivilege.category = seedPriv.category;
					updated = true;
				}
				if (dbPrivilege.isActive !== seedPriv.isActive) {
					dbPrivilege.isActive = seedPriv.isActive;
					updated = true;
				}

				if (updated) {
					await this.repo.save(dbPrivilege);
				}
			}
		}
	}
}
