import { LogoutAuthRequestDto } from './dtos/request/logout-auth.request.dto';
import { AuthService } from 'src/auth/auth.service';
import LoginAuthRequestDto from 'src/auth/dtos/request/login-auth-request.dto';
import HttpResponse from '@shared/utils/http-response';
import { ConfigService } from '@nestjs/config';
import { AuthMeRequestDto } from 'src/auth/dtos/request/auth-me-request.dto';
import { ValidateTokenRequestDto } from 'src/auth/dtos/request/validate-token-request.dto';
export declare class AuthController {
    private readonly authService;
    private readonly config;
    constructor(authService: AuthService, config: ConfigService);
    login(data: LoginAuthRequestDto): Promise<HttpResponse>;
    validateToken(data: ValidateTokenRequestDto): Promise<HttpResponse>;
    refreshToken(data: {
        refreshToken: string;
        identityApiKey?: string;
    }): Promise<HttpResponse>;
    me(data: AuthMeRequestDto): Promise<HttpResponse>;
    logout(data: LogoutAuthRequestDto): Promise<HttpResponse>;
}
