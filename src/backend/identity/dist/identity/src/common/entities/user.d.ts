import { Role } from 'src/common/entities/role';
export declare class User {
    userId: string;
    username: string;
    email?: string;
    ownerId?: string;
    password: string;
    roles: Role[];
}
