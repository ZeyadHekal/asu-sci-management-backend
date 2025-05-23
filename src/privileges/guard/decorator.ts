import { SetMetadata } from '@nestjs/common';

export const PRIVILEGES_METADATA_KEY = 'required_privileges';

export interface PrivilegesLogic {
	and?: (string | PrivilegesLogic)[];
	or?: (string | PrivilegesLogic)[];
}

export const RequirePrivileges = (logic: PrivilegesLogic) => SetMetadata(PRIVILEGES_METADATA_KEY, logic);
