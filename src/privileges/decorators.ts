import { SetMetadata } from '@nestjs/common';

export const Privileges = (privilegeExpression: PrivilegeExpression) => SetMetadata('privileges', privilegeExpression);
