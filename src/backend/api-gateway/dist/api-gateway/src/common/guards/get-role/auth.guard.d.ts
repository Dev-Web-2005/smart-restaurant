import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
export declare class AuthGuard implements CanActivate {
    private readonly identityClient;
    private readonly configService;
    constructor(identityClient: ClientProxy, configService: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
