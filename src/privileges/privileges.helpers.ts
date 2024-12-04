import { DataSource } from 'typeorm';
import * as path from 'path';
import * as glob from 'glob';
import { Privilege } from '../database/privileges/privilege.entity';

export async function autoRegisterPrivileges(dataSource: DataSource) {
	// const privilegeGroupRepository = dataSource.getRepository(PrivilegeGroup);
	// const privilegeRepository = dataSource.getRepository(Privilege);

	// // Scan for all `.privilege.ts` files
	// const files = glob.sync(path.join(__dirname, '**/*.privilege.ts'));

	// const predefinedPrivileges: { privilege: Privilege; group: PrivilegeGroup }[] = [];
	const files = [] as any;
	for (const file of files) {
		const module = await import(file);
		for (const exported of Object.values(module)) {
			// if (exported.prototype instanceof Privilege) {
			// 	const instance: Privilege = new exported();
			// 	// Optionally define group logic here (e.g., using metadata)
			// 	const groupName = instance.name; // Replace with actual logic for grouping
			// 	const group = await privilegeGroupRepository.save(privilegeGroupRepository.create({ name: groupName, description: `Group for ${groupName}` }));
			// 	predefinedPrivileges.push({ privilege: instance, group });
			// }
		}
	}

	// Save privileges to the database
	// for (const { privilege, group } of predefinedPrivileges) {
	// 	const exists = await privilegeRepository.findOneBy({ code: privilege.code });
	// 	if (!exists) {
	// 		privilege.group = group;
	// 		await privilegeRepository.save(privilege);
	// 	}
	// }
}
