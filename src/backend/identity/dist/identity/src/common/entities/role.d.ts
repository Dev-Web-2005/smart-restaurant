import { Authority } from 'src/common/entities/authority';
import { User } from 'src/common/entities/user';
export declare class Role {
    name: number;
    description?: string;
    createdAt: Date;
    users: User[];
    authorities: Authority[];
}
