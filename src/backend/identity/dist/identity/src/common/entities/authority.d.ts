import { Role } from 'src/common/entities/role';
export declare class Authority {
    name: number;
    description?: string;
    createdAt: Date;
    roles: Role[];
}
