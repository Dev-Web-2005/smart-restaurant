import { ItemService } from './item.service';
import HttpResponse from '@shared/utils/http-response';
import { CreateItemRequestDto, GetItemsRequestDto, UpdateItemRequestDto, PublishItemRequestDto, DeleteItemRequestDto, AddModifiersRequestDto } from 'src/item/dtos/request';
export declare class ItemController {
    private readonly itemService;
    constructor(itemService: ItemService);
    createItem(dto: CreateItemRequestDto): Promise<HttpResponse>;
    getItems(dto: GetItemsRequestDto): Promise<HttpResponse>;
    updateItem(dto: UpdateItemRequestDto): Promise<HttpResponse>;
    publishItem(dto: PublishItemRequestDto): Promise<HttpResponse>;
    deleteItem(dto: DeleteItemRequestDto): Promise<HttpResponse>;
    addModifiers(dto: AddModifiersRequestDto): Promise<HttpResponse>;
}
