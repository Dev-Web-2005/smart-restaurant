import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import type { Response } from 'express';
export declare class TableController {
    private readonly tableClient;
    private readonly configService;
    constructor(tableClient: ClientProxy, configService: ConfigService);
    createTable(tenantId: string, data: any): import("rxjs").Observable<any>;
    listTables(tenantId: string, isActive?: string, status?: string, floorId?: string, includeFloor?: string): import("rxjs").Observable<any>;
    getTableById(tenantId: string, tableId: string): import("rxjs").Observable<any>;
    updateTable(tenantId: string, tableId: string, data: any): import("rxjs").Observable<any>;
    deleteTable(tenantId: string, tableId: string): import("rxjs").Observable<any>;
    generateQrCode(tenantId: string, tableId: string): import("rxjs").Observable<any>;
    getQrCode(tenantId: string, tableId: string): import("rxjs").Observable<any>;
    downloadQrCode(tenantId: string, tableId: string, format: string, res: Response): Promise<Response<any, Record<string, any>>>;
    batchDownloadQrCode(res: Response, tenantId: string, format?: string, tableIds?: string, floorId?: string): Promise<Response<any, Record<string, any>>>;
    validateScan(tenantId: string, token: string, res: Response): Promise<void | Response<any, Record<string, any>>>;
    bulkRegenerateQrCode(tenantId: string, body: {
        tableIds?: string[];
        floorId?: string;
    }): import("rxjs").Observable<any>;
}
