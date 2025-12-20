import { UsersService } from 'src/users/users.service';
import HttpResponse from '@shared/utils/http-response';
import { ConfigService } from '@nestjs/config';
import RegisterUserWithProfileRequestDto from 'src/users/dtos/request/register-user-with-profile-request.dto';
import { GetAllUsersRequestDto } from 'src/users/dtos/request/get-all-users-request.dto';
import { GetUserByIdRequestDto } from 'src/users/dtos/request/get-user-by-id-request.dto';
export declare class UsersController {
    private readonly usersService;
    private readonly config;
    constructor(usersService: UsersService, config: ConfigService);
    registerUser(data: RegisterUserWithProfileRequestDto): Promise<HttpResponse>;
    getAllUsers(data: GetAllUsersRequestDto): Promise<HttpResponse>;
    getUserById(data: GetUserByIdRequestDto): Promise<HttpResponse>;
}
