import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import type { Response } from 'express';
export declare class TableController {
    private readonly tableClient;
    private readonly configService;
    constructor(tableClient: ClientProxy, configService: ConfigService);
    createTable(tenantId: string, data: any): import("rxjs").Observable<any>;
    listTables(tenantId: string, isActive?: string, location?: string): import("rxjs").Observable<any>;
    getTableById(tenantId: string, tableId: string): import("rxjs").Observable<any>;
    updateTable(tenantId: string, tableId: string, data: any): import("rxjs").Observable<any>;
    deleteTable(tenantId: string, tableId: string): import("rxjs").Observable<any>;
    generateQrCode(tableId: string, req: Request): import("rxjs").Observable<any>;
    validateScan(token: string, res: Response): Promise<void | Response<any, Record<string, any>>>;
}
