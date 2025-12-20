import { HttpResponse } from '@shared/utils';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import type { Request } from 'express';
export declare class ProfileController {
    private readonly profileClient;
    private readonly configService;
    constructor(profileClient: ClientProxy, configService: ConfigService);
    getMyProfile(req: Request): import("rxjs").Observable<any>;
    modifyProfile(data: any, req: Request): import("rxjs").Observable<any>;
    getVerifiedState(req: Request): Promise<HttpResponse>;
    getProfile(userId: string): import("rxjs").Observable<any>;
}
