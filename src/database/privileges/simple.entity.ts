import { ChildEntity } from 'typeorm';
import { Privilege } from './privilege.entity';

@ChildEntity('simple')
export class SimplePrivilege extends Privilege {
	validateParameters(params: any): boolean {
		return true; // No parameters to validate
	}
}
