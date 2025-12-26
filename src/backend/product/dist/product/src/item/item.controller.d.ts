import { ItemService } from './item.service';
import HttpResponse from '@shared/utils/http-response';
import { CreateMenuItemRequestDto, GetMenuItemsRequestDto, GetMenuItemRequestDto, UpdateMenuItemRequestDto, UpdateMenuItemStatusRequestDto, DeleteMenuItemRequestDto, AddMenuItemPhotoRequestDto, UpdateMenuItemPhotoRequestDto, SetPrimaryPhotoRequestDto, DeleteMenuItemPhotoRequestDto, GetMenuItemPhotosRequestDto } from 'src/item/dtos/request';
export declare class ItemController {
    private readonly itemService;
    constructor(itemService: ItemService);
    createMenuItem(dto: CreateMenuItemRequestDto): Promise<HttpResponse>;
    getMenuItems(dto: GetMenuItemsRequestDto): Promise<HttpResponse>;
    getMenuItem(dto: GetMenuItemRequestDto): Promise<HttpResponse>;
    updateMenuItem(dto: UpdateMenuItemRequestDto): Promise<HttpResponse>;
    updateMenuItemStatus(dto: UpdateMenuItemStatusRequestDto): Promise<HttpResponse>;
    deleteMenuItem(dto: DeleteMenuItemRequestDto): Promise<HttpResponse>;
    addMenuItemPhoto(dto: AddMenuItemPhotoRequestDto): Promise<HttpResponse>;
    getMenuItemPhotos(dto: GetMenuItemPhotosRequestDto): Promise<HttpResponse>;
    updateMenuItemPhoto(dto: UpdateMenuItemPhotoRequestDto): Promise<HttpResponse>;
    setPrimaryPhoto(dto: SetPrimaryPhotoRequestDto): Promise<HttpResponse>;
    deleteMenuItemPhoto(dto: DeleteMenuItemPhotoRequestDto): Promise<HttpResponse>;
}
