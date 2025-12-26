import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { MenuItem, MenuCategory, MenuItemPhoto } from 'src/common/entities';
import { MenuItemResponseDto, PaginatedMenuItemsResponseDto } from './dtos/response/menu-item-response.dto';
import { MenuItemPhotoResponseDto, MenuItemPhotosListResponseDto } from './dtos/response/menu-item-photo-response.dto';
import { CreateMenuItemRequestDto, GetMenuItemsRequestDto, GetMenuItemRequestDto, UpdateMenuItemRequestDto, UpdateMenuItemStatusRequestDto, DeleteMenuItemRequestDto, AddMenuItemPhotoRequestDto, UpdateMenuItemPhotoRequestDto, SetPrimaryPhotoRequestDto, DeleteMenuItemPhotoRequestDto, GetMenuItemPhotosRequestDto } from 'src/item/dtos/request';
export declare class ItemService {
    private readonly menuItemRepository;
    private readonly categoryRepository;
    private readonly photoRepository;
    private readonly configService;
    constructor(menuItemRepository: Repository<MenuItem>, categoryRepository: Repository<MenuCategory>, photoRepository: Repository<MenuItemPhoto>, configService: ConfigService);
    private validateApiKey;
    createMenuItem(dto: CreateMenuItemRequestDto): Promise<MenuItemResponseDto>;
    getMenuItems(dto: GetMenuItemsRequestDto): Promise<PaginatedMenuItemsResponseDto>;
    getMenuItem(dto: GetMenuItemRequestDto): Promise<MenuItemResponseDto>;
    updateMenuItem(dto: UpdateMenuItemRequestDto): Promise<MenuItemResponseDto>;
    updateMenuItemStatus(dto: UpdateMenuItemStatusRequestDto): Promise<MenuItemResponseDto>;
    deleteMenuItem(dto: DeleteMenuItemRequestDto): Promise<void>;
    private toResponseDto;
    addMenuItemPhoto(dto: AddMenuItemPhotoRequestDto): Promise<MenuItemPhotoResponseDto>;
    getMenuItemPhotos(dto: GetMenuItemPhotosRequestDto): Promise<MenuItemPhotosListResponseDto>;
    updateMenuItemPhoto(dto: UpdateMenuItemPhotoRequestDto): Promise<MenuItemPhotoResponseDto>;
    setPrimaryPhoto(dto: SetPrimaryPhotoRequestDto): Promise<MenuItemPhotoResponseDto>;
    deleteMenuItemPhoto(dto: DeleteMenuItemPhotoRequestDto): Promise<void>;
    private toPhotoResponseDto;
}
