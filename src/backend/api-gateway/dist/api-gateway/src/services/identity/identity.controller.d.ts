import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import type { Request, Response } from 'express';
export declare class IdentityController {
    private readonly identityClient;
    private readonly configService;
    constructor(identityClient: ClientProxy, configService: ConfigService);
    registerUser(data: any): import("rxjs").Observable<any>;
    getMyUser(req: Request): import("rxjs").Observable<any>;
    getAllUsers(): import("rxjs").Observable<any>;
    getUserById(userId: string): import("rxjs").Observable<any>;
    createRole(data: any): import("rxjs").Observable<any>;
    getAllRoles(): import("rxjs").Observable<any>;
    createAuthority(data: any): import("rxjs").Observable<any>;
    getAllAuthorities(): import("rxjs").Observable<any>;
    login(data: any, res: Response): Promise<Response<any, Record<string, any>>>;
    refreshToken(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    me(req: Request): import("rxjs").Observable<any>;
    logout(res: Response, req: Request): Promise<Response<any, Record<string, any>>>;
}
