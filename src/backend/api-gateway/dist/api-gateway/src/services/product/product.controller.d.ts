import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
export declare class ProductController {
    private readonly productClient;
    private readonly configService;
    constructor(productClient: ClientProxy, configService: ConfigService);
    createCategory(tenantId: string, data: any): import("rxjs").Observable<any>;
    getCategories(tenantId: string): import("rxjs").Observable<any>;
    updateCategory(categoryId: string, data: any): import("rxjs").Observable<any>;
    publishCategory(categoryId: string, data: any): import("rxjs").Observable<any>;
    deleteCategory(categoryId: string, data: any): import("rxjs").Observable<any>;
    createItem(tenantId: string, data: any): import("rxjs").Observable<any>;
    getItems(tenantId: string, categoryId?: string): import("rxjs").Observable<any>;
    updateItem(itemId: string, data: any): import("rxjs").Observable<any>;
    publishItem(itemId: string, data: any): import("rxjs").Observable<any>;
    deleteItem(itemId: string, data: any): import("rxjs").Observable<any>;
    addModifiers(itemId: string, data: any): import("rxjs").Observable<any>;
    getPublicMenu(tenantId: string): import("rxjs").Observable<any>;
}
