import { PrivilegeCode } from "src/privileges/definition";

export interface UserTypeConfig {
    name: string;
    privilegeCode: PrivilegeCode;
    isAdmin?: boolean;
}

export const USER_TYPES_CONFIG: UserTypeConfig[] = [
    { name: 'Admin', privilegeCode: PrivilegeCode.MANAGE_SYSTEM, isAdmin: true },
    { name: 'Secretary', privilegeCode: PrivilegeCode.MANAGE_STUDENTS },
    { name: 'Lab Admin', privilegeCode: PrivilegeCode.MANAGE_LABS },
    { name: 'Student', privilegeCode: PrivilegeCode.REPORT_DEVICE }
]; 