import { ChildEntity } from 'typeorm';
import { Privilege } from './privilege.entity';

@ChildEntity('parameterized')
export class ParameterizedPrivilege extends Privilege {
	validateParameters(params: any): boolean {
		try {
			const structure = JSON.parse(this.parameterStructure);
			// Use a library like AJV for JSON schema validation
			return true;
		} catch (e) {
			return false;
		}
	}
}
