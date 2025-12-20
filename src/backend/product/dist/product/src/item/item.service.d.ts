import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { MenuItem, ModifierOption } from 'src/common/entities';
import { ItemResponseDto } from './dtos/response/item-response.dto';
import { CreateItemRequestDto, GetItemsRequestDto, UpdateItemRequestDto, PublishItemRequestDto, DeleteItemRequestDto, AddModifiersRequestDto } from 'src/item/dtos/request';
export declare class ItemService {
    private readonly itemRepository;
    private readonly modifierRepository;
    private readonly configService;
    constructor(itemRepository: Repository<MenuItem>, modifierRepository: Repository<ModifierOption>, configService: ConfigService);
    private validateApiKey;
    createItem(dto: CreateItemRequestDto): Promise<ItemResponseDto>;
    getItems(dto: GetItemsRequestDto): Promise<ItemResponseDto[]>;
    updateItem(dto: UpdateItemRequestDto): Promise<ItemResponseDto>;
    publishItem(dto: PublishItemRequestDto): Promise<ItemResponseDto>;
    deleteItem(dto: DeleteItemRequestDto): Promise<void>;
    addModifiers(dto: AddModifiersRequestDto): Promise<ItemResponseDto>;
    private toResponseDto;
    private toModifierDto;
}
