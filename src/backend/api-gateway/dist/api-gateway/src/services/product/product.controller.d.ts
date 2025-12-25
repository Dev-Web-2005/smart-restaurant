import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
export declare class ProductController {
    private readonly productClient;
    private readonly configService;
    constructor(productClient: ClientProxy, configService: ConfigService);
    createCategory(tenantId: string, data: any): import("rxjs").Observable<any>;
    getCategories(tenantId: string, status?: string, search?: string, sortBy?: string, sortOrder?: string): import("rxjs").Observable<any>;
    updateCategory(tenantId: string, categoryId: string, data: any): import("rxjs").Observable<any>;
    updateCategoryStatus(tenantId: string, categoryId: string, data: any): import("rxjs").Observable<any>;
    deleteCategory(tenantId: string, categoryId: string, data: any): import("rxjs").Observable<any>;
    createItem(tenantId: string, data: any): import("rxjs").Observable<any>;
    getItems(tenantId: string, categoryId?: string): import("rxjs").Observable<any>;
    updateItem(tenantId: string, itemId: string, data: any): import("rxjs").Observable<any>;
    publishItem(tenantId: string, itemId: string, data: any): import("rxjs").Observable<any>;
    deleteItem(tenantId: string, itemId: string, data: any): import("rxjs").Observable<any>;
    addModifiers(tenantId: string, itemId: string, data: any): import("rxjs").Observable<any>;
    getPublicMenu(tenantId: string): import("rxjs").Observable<any>;
}
