import { User } from 'src/common/entities/user';
import { Repository } from 'typeorm';
import { RolesService } from 'src/roles/roles.service';
import { GetUserResponseDto } from 'src/users/dtos/response/get-user-response.dto';
import RegisterUserResponseDto from 'src/users/dtos/response/register-user-response.dto';
import { ClientProxy } from '@nestjs/microservices';
import RegisterUserWithProfileRequestDto from 'src/users/dtos/request/register-user-with-profile-request.dto';
export declare class UsersService {
    private readonly userRepository;
    private readonly rolesService;
    private readonly profileClient;
    private readonly PROFILE_FIELDS;
    constructor(userRepository: Repository<User>, rolesService: RolesService, profileClient: ClientProxy);
    Register(data: RegisterUserWithProfileRequestDto): Promise<RegisterUserResponseDto>;
    getAllUsers(): Promise<GetUserResponseDto[]>;
    getUserById(userId: string): Promise<GetUserResponseDto | null>;
}
