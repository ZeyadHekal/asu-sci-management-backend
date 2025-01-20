import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PRIVILEGE_SEED_DATA } from './definition';
import { Privilege } from 'src/database/privileges/privilege.entity';

@Injectable()
export class PrivilegeSeeder implements OnModuleInit {
	constructor(private dataSource: DataSource) { }

	async onModuleInit() {
		await this.syncPrivileges();
	}

	private async syncPrivileges() {
		const repo = this.dataSource.getRepository(Privilege);
		const existing = await repo.find();

		const definedPrivileges = PRIVILEGE_SEED_DATA.map((p) => p.code);
		const existingNames = existing.map((e) => e.code);

		// Add missing privileges
		const toAdd = PRIVILEGE_SEED_DATA.filter((p) => !existingNames.includes(p.code));
		if (toAdd.length) {
			await repo.insert(toAdd);
		}

		// Remove extraneous privileges
		const toRemove = existing.filter((e) => !definedPrivileges.includes(e.code));
		if (toRemove.length) {
			await repo.remove(toRemove);
		}

		// Update changed attributes if needed
		for (const seedPriv of PRIVILEGE_SEED_DATA) {
			const dbPrivilege = await repo.findOneBy({ code: seedPriv.code });
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

				if (updated) {
					await repo.save(dbPrivilege);
				}
			}
		}
	}
}
